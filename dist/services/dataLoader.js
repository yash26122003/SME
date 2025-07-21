"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalmartDataLoader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const logger_1 = require("../utils/logger");
class WalmartDataLoader {
    constructor(pool) {
        this.pool = pool;
    }
    async loadWalmartSalesData() {
        const csvFilePath = path_1.default.join(process.cwd(), 'Walmart_Sales.csv');
        const errors = [];
        let recordsLoaded = 0;
        if (!fs_1.default.existsSync(csvFilePath)) {
            throw new Error(`CSV file not found at: ${csvFilePath}`);
        }
        try {
            // Create tables if they don't exist
            await this.initializeTables();
            // Clear existing data (optional - comment out if you want to preserve data)
            await this.pool.query('DELETE FROM walmart_sales');
            logger_1.logger.info('Cleared existing Walmart sales data');
            // Read and process CSV data
            const records = [];
            return new Promise((resolve) => {
                fs_1.default.createReadStream(csvFilePath)
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (row) => {
                    records.push(row);
                })
                    .on('end', async () => {
                    logger_1.logger.info(`Read ${records.length} records from CSV`);
                    // Insert records in batches
                    const batchSize = 1000;
                    for (let i = 0; i < records.length; i += batchSize) {
                        const batch = records.slice(i, i + batchSize);
                        try {
                            await this.insertBatch(batch);
                            recordsLoaded += batch.length;
                            logger_1.logger.info(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
                        }
                        catch (error) {
                            const errorMsg = `Error inserting batch ${Math.floor(i / batchSize) + 1}: ${error}`;
                            logger_1.logger.error(errorMsg);
                            errors.push(errorMsg);
                        }
                    }
                    // Update analytics after data load
                    await this.updateAnalyticsCache();
                    resolve({ success: errors.length === 0, recordsLoaded, errors });
                })
                    .on('error', (error) => {
                    logger_1.logger.error('Error reading CSV file:', error);
                    errors.push(`CSV reading error: ${error.message}`);
                    resolve({ success: false, recordsLoaded, errors });
                });
            });
        }
        catch (error) {
            logger_1.logger.error('Error in data loading process:', error);
            return { success: false, recordsLoaded, errors: [error.message] };
        }
    }
    async initializeTables() {
        const schemaPath = path_1.default.join(__dirname, '../database/schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
        // Split schema by semicolons and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
        for (const statement of statements) {
            try {
                await this.pool.query(statement);
            }
            catch (error) {
                logger_1.logger.warn(`Schema statement warning: ${error.message}`);
            }
        }
    }
    async insertBatch(records) {
        if (records.length === 0)
            return;
        const values = records.map(record => {
            // Parse and clean the data
            const store = parseInt(record.Store);
            const date = this.parseDate(record.Date);
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
        await this.pool.query(query, flatValues);
    }
    parseDate(dateStr) {
        // Convert DD-MM-YYYY to YYYY-MM-DD
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    async updateAnalyticsCache() {
        try {
            // Cache key metrics for faster dashboard loading
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
                },
                {
                    key: 'store_performance',
                    query: `
            SELECT 
              s.store,
              s.total_sales,
              s.avg_weekly_sales,
              si.store_name,
              si.location,
              si.type,
              si.size_sq_ft,
              CASE 
                WHEN s.total_sales > (SELECT AVG(total_sales) FROM (
                  SELECT SUM(weekly_sales) as total_sales FROM walmart_sales GROUP BY store
                ) avg_calc) THEN 'High Performer'
                ELSE 'Average Performer'
              END as performance_category
            FROM (
              SELECT 
                store,
                SUM(weekly_sales) as total_sales,
                AVG(weekly_sales) as avg_weekly_sales
              FROM walmart_sales 
              GROUP BY store
            ) s
            LEFT JOIN store_info si ON s.store = si.store_id
            ORDER BY s.total_sales DESC
          `
                }
            ];
            for (const { key, query } of queries) {
                const result = await this.pool.query(query);
                const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour cache
                await this.pool.query(`
          INSERT INTO analytics_cache (cache_key, cache_data, expires_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (cache_key) 
          DO UPDATE SET cache_data = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP
        `, [key, JSON.stringify(result.rows), expiresAt]);
                logger_1.logger.info(`Updated analytics cache for: ${key}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error updating analytics cache:', error);
        }
    }
    async getDataSummary() {
        try {
            const summary = await this.pool.query(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT store) as unique_stores,
          MIN(date) as earliest_date,
          MAX(date) as latest_date,
          SUM(weekly_sales) as total_sales,
          AVG(weekly_sales) as avg_weekly_sales,
          SUM(CASE WHEN holiday_flag = 1 THEN 1 ELSE 0 END) as holiday_weeks,
          AVG(temperature) as avg_temperature,
          AVG(fuel_price) as avg_fuel_price,
          AVG(unemployment) as avg_unemployment
        FROM walmart_sales
      `);
            return summary.rows[0];
        }
        catch (error) {
            logger_1.logger.error('Error getting data summary:', error);
            throw error;
        }
    }
}
exports.WalmartDataLoader = WalmartDataLoader;
//# sourceMappingURL=dataLoader.js.map