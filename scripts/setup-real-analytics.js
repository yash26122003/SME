const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'business_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
  console.log('🔧 Initializing database schema...');
  
  // Read and execute schema
  const schemaPath = path.join(__dirname, '../src/server/database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Split schema by semicolons and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
  
  for (const statement of statements) {
    try {
      await pool.query(statement);
      console.log('✅ Schema statement executed');
    } catch (error) {
      console.log('⚠️  Schema statement warning:', error.message);
    }
  }
  
  console.log('✅ Database schema initialized');
}

async function loadWalmartData() {
  console.log('📊 Loading Walmart sales data...');
  
  const csvFilePath = path.join(__dirname, '../Walmart_Sales.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ Walmart_Sales.csv not found at:', csvFilePath);
    return;
  }
  
  // Clear existing data
  await pool.query('DELETE FROM walmart_sales');
  console.log('🧹 Cleared existing data');
  
  const records = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        records.push(row);
      })
      .on('end', async () => {
        console.log(`📝 Read ${records.length} records from CSV`);
        
        // Insert records in batches
        const batchSize = 1000;
        let inserted = 0;
        
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          try {
            await insertBatch(batch);
            inserted += batch.length;
            console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records (Total: ${inserted})`);
          } catch (error) {
            console.error('❌ Error inserting batch:', error.message);
          }
        }
        
        console.log(`🎉 Successfully loaded ${inserted} Walmart sales records!`);
        await updateAnalyticsCache();
        resolve();
      })
      .on('error', reject);
  });
}

async function insertBatch(records) {
  if (records.length === 0) return;

  const values = records.map(record => {
    // Parse and clean the data
    const store = parseInt(record.Store);
    const date = parseDate(record.Date);
    const weeklySales = parseFloat(record.Weekly_Sales);
    const holidayFlag = parseInt(record.Holiday_Flag);
    const temperature = parseFloat(record.Temperature) || null;
    const fuelPrice = parseFloat(record.Fuel_Price) || null;
    const cpi = parseFloat(record.CPI) || null;
    const unemployment = parseFloat(record.Unemployment) || null;

    return [store, date, weeklySales, holidayFlag, temperature, fuelPrice, cpi, unemployment];
  });

  const placeholders = values.map((_, index) => {
    const base = index * 8;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
  }).join(', ');

  const query = `
    INSERT INTO walmart_sales (store, date, weekly_sales, holiday_flag, temperature, fuel_price, cpi, unemployment)
    VALUES ${placeholders}
  `;

  const flatValues = values.flat();
  await pool.query(query, flatValues);
}

function parseDate(dateStr) {
  // Convert DD-MM-YYYY to YYYY-MM-DD
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function updateAnalyticsCache() {
  console.log('🔄 Updating analytics cache...');
  
  const queries = [
    {
      key: 'total_sales_by_store',
      query: `
        SELECT 
          store,
          COUNT(*) as total_weeks,
          SUM(weekly_sales) as total_sales,
          AVG(weekly_sales) as avg_weekly_sales,
          MIN(weekly_sales) as min_sales,
          MAX(weekly_sales) as max_sales,
          STDDEV(weekly_sales) as sales_stddev
        FROM walmart_sales 
        GROUP BY store 
        ORDER BY total_sales DESC
      `
    },
    {
      key: 'sales_trends',
      query: `
        SELECT 
          DATE_TRUNC('month', date) as month,
          SUM(weekly_sales) as monthly_sales,
          AVG(weekly_sales) as avg_weekly_sales,
          COUNT(*) as weeks_count
        FROM walmart_sales 
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month
      `
    },
    {
      key: 'holiday_impact',
      query: `
        SELECT 
          holiday_flag,
          COUNT(*) as record_count,
          AVG(weekly_sales) as avg_sales,
          SUM(weekly_sales) as total_sales
        FROM walmart_sales 
        GROUP BY holiday_flag
      `
    }
  ];

  for (const { key, query } of queries) {
    try {
      const result = await pool.query(query);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour cache

      await pool.query(`
        INSERT INTO analytics_cache (cache_key, cache_data, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (cache_key) 
        DO UPDATE SET cache_data = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP
      `, [key, JSON.stringify(result.rows), expiresAt]);

      console.log(`✅ Updated analytics cache: ${key}`);
    } catch (error) {
      console.error(`❌ Error updating cache for ${key}:`, error.message);
    }
  }
}

async function printSummary() {
  console.log('\n📈 Data Summary:');
  
  const summary = await pool.query(`
    SELECT 
      COUNT(*) as total_records,
      COUNT(DISTINCT store) as unique_stores,
      MIN(date) as earliest_date,
      MAX(date) as latest_date,
      SUM(weekly_sales) as total_sales,
      AVG(weekly_sales) as avg_weekly_sales,
      SUM(CASE WHEN holiday_flag = 1 THEN 1 ELSE 0 END) as holiday_weeks
    FROM walmart_sales
  `);
  
  const data = summary.rows[0];
  console.log(`📊 Total Records: ${parseInt(data.total_records).toLocaleString()}`);
  console.log(`🏪 Unique Stores: ${data.unique_stores}`);
  console.log(`📅 Date Range: ${data.earliest_date.toISOString().split('T')[0]} to ${data.latest_date.toISOString().split('T')[0]}`);
  console.log(`💰 Total Sales: $${parseFloat(data.total_sales).toLocaleString()}`);
  console.log(`💵 Average Weekly Sales: $${parseFloat(data.avg_weekly_sales).toLocaleString()}`);
  console.log(`🎄 Holiday Weeks: ${data.holiday_weeks}`);
}

async function testGeminiConnection() {
  console.log('\n🤖 Testing Gemini API connection...');
  
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  
  if (!geminiKey) {
    console.error('❌ No Gemini API key found. Please set GEMINI_API_KEY or GOOGLE_AI_API_KEY in your environment');
    return;
  }
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Test connection - respond with OK');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API connected successfully');
    console.log(`🔍 Test response: ${text.substring(0, 50)}...`);
  } catch (error) {
    console.error('❌ Gemini API connection failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Real Analytics Setup...\n');
  
  try {
    await initializeDatabase();
    await loadWalmartData();
    await printSummary();
    await testGeminiConnection();
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Visit the NLP Query interface');
    console.log('3. Try asking: "Which store has the highest sales?"');
    console.log('4. Or: "Show me sales trends by month"');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
