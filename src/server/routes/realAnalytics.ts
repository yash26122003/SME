import { Router } from 'express';
import { Pool } from 'pg';
import { WalmartDataLoader } from '../services/dataLoader';
import { NLPQueryEngine } from '../services/nlpQueryEngine';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Initialize database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'business_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

const dataLoader = new WalmartDataLoader(pool);
const nlpEngine = new NLPQueryEngine(pool);

// Load Walmart data endpoint
router.post('/load-walmart-data', authenticateToken, async (req, res) => {
  try {
    logger.info('Starting Walmart data load process');
    
    const result = await dataLoader.loadWalmartSalesData();
    
    if (result.success) {
      res.json({
        message: 'Walmart data loaded successfully',
        recordsLoaded: result.recordsLoaded,
        errors: result.errors
      });
    } else {
      res.status(400).json({
        message: 'Data load completed with errors',
        recordsLoaded: result.recordsLoaded,
        errors: result.errors
      });
    }
  } catch (error) {
    logger.error('Error loading Walmart data:', error);
    res.status(500).json({ error: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error' });
  }
});

// Get data summary
router.get('/data-summary', authenticateToken, async (req, res) => {
  try {
    const summary = await dataLoader.getDataSummary();
    res.json(summary);
  } catch (error) {
    logger.error('Error getting data summary:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Natural Language Query endpoint - THE MAIN FEATURE
router.post('/nlp-query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    const userId = (req as any).user?.userId;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    logger.info(`Processing NLP query from user ${userId}: "${query}"`);

    const result = await nlpEngine.processNaturalLanguageQuery(query, userId);

    res.json(result);
  } catch (error) {
    logger.error('Error processing NLP query:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get query history
router.get('/query-history', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await nlpEngine.getQueryHistory(userId, limit);
    res.json(history);
  } catch (error) {
    logger.error('Error getting query history:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get real-time sales metrics
router.get('/realtime-metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = await pool.query(`
      SELECT 
        'Total Sales' as metric,
        SUM(weekly_sales) as value,
        'currency' as type
      FROM walmart_sales
      UNION ALL
      SELECT 
        'Average Weekly Sales' as metric,
        AVG(weekly_sales) as value,
        'currency' as type
      FROM walmart_sales
      UNION ALL
      SELECT 
        'Total Weeks' as metric,
        COUNT(*) as value,
        'number' as type
      FROM walmart_sales
      UNION ALL
      SELECT 
        'Active Stores' as metric,
        COUNT(DISTINCT store) as value,
        'number' as type
      FROM walmart_sales
    `);

    res.json(metrics.rows);
  } catch (error) {
    logger.error('Error getting real-time metrics:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get sales trends
router.get('/sales-trends', authenticateToken, async (req, res) => {
  try {
    const { period = 'month', store } = req.query;
    
    let dateGroup;
    switch (period) {
      case 'week':
        dateGroup = 'week';
        break;
      case 'quarter':
        dateGroup = 'quarter';
        break;
      default:
        dateGroup = 'month';
    }

    let whereClause = '';
    let params: any[] = [];
    
    if (store) {
      whereClause = 'WHERE store = $1';
      params = [store];
    }

    const trends = await pool.query(`
      SELECT 
        DATE_TRUNC('${dateGroup}', date) as period,
        SUM(weekly_sales) as total_sales,
        AVG(weekly_sales) as avg_sales,
        COUNT(*) as weeks,
        AVG(CASE WHEN holiday_flag = 1 THEN weekly_sales END) as holiday_avg,
        AVG(CASE WHEN holiday_flag = 0 THEN weekly_sales END) as regular_avg
      FROM walmart_sales
      ${whereClause}
      GROUP BY DATE_TRUNC('${dateGroup}', date)
      ORDER BY period
    `, params);

    res.json(trends.rows);
  } catch (error) {
    logger.error('Error getting sales trends:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get store performance
router.get('/store-performance', authenticateToken, async (req, res) => {
  try {
    const performance = await pool.query(`
      SELECT 
        ws.store,
        si.store_name,
        si.location,
        si.type,
        COUNT(*) as total_weeks,
        SUM(ws.weekly_sales) as total_sales,
        AVG(ws.weekly_sales) as avg_weekly_sales,
        MIN(ws.weekly_sales) as min_sales,
        MAX(ws.weekly_sales) as max_sales,
        STDDEV(ws.weekly_sales) as sales_volatility,
        AVG(CASE WHEN ws.holiday_flag = 1 THEN ws.weekly_sales END) as holiday_performance,
        COUNT(CASE WHEN ws.holiday_flag = 1 THEN 1 END) as holiday_weeks,
        RANK() OVER (ORDER BY SUM(ws.weekly_sales) DESC) as sales_rank
      FROM walmart_sales ws
      LEFT JOIN store_info si ON ws.store = si.store_id
      GROUP BY ws.store, si.store_name, si.location, si.type
      ORDER BY total_sales DESC
    `);

    res.json(performance.rows);
  } catch (error) {
    logger.error('Error getting store performance:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get holiday impact analysis
router.get('/holiday-impact', authenticateToken, async (req, res) => {
  try {
    const impact = await pool.query(`
      SELECT 
        holiday_flag,
        COUNT(*) as weeks_count,
        AVG(weekly_sales) as avg_sales,
        SUM(weekly_sales) as total_sales,
        MIN(weekly_sales) as min_sales,
        MAX(weekly_sales) as max_sales,
        STDDEV(weekly_sales) as sales_stddev,
        AVG(temperature) as avg_temp,
        AVG(fuel_price) as avg_fuel_price,
        AVG(unemployment) as avg_unemployment
      FROM walmart_sales
      GROUP BY holiday_flag
      ORDER BY holiday_flag
    `);

    // Calculate lift
    const holidayData = impact.rows.find(row => row.holiday_flag === 1);
    const regularData = impact.rows.find(row => row.holiday_flag === 0);
    
    const holidayLift = holidayData && regularData ? 
      ((parseFloat(holidayData.avg_sales) - parseFloat(regularData.avg_sales)) / parseFloat(regularData.avg_sales)) * 100 
      : 0;

    res.json({
      comparison: impact.rows,
      holidayLift: holidayLift.toFixed(2)
    });
  } catch (error) {
    logger.error('Error getting holiday impact:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get correlation analysis
router.get('/correlation-analysis', authenticateToken, async (req, res) => {
  try {
    const correlations = await pool.query(`
      SELECT 
        CORR(weekly_sales, temperature) as sales_temperature_corr,
        CORR(weekly_sales, fuel_price) as sales_fuel_price_corr,
        CORR(weekly_sales, cpi) as sales_cpi_corr,
        CORR(weekly_sales, unemployment) as sales_unemployment_corr,
        CORR(temperature, fuel_price) as temp_fuel_corr,
        AVG(weekly_sales) as avg_sales,
        AVG(temperature) as avg_temperature,
        AVG(fuel_price) as avg_fuel_price,
        AVG(cpi) as avg_cpi,
        AVG(unemployment) as avg_unemployment
      FROM walmart_sales
      WHERE temperature IS NOT NULL 
        AND fuel_price IS NOT NULL 
        AND cpi IS NOT NULL 
        AND unemployment IS NOT NULL
    `);

    res.json(correlations.rows[0]);
  } catch (error) {
    logger.error('Error getting correlation analysis:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get cached analytics data
router.get('/cached-analytics/:cacheKey', authenticateToken, async (req, res) => {
  try {
    const { cacheKey } = req.params;
    
    const cached = await pool.query(`
      SELECT cache_data, expires_at, created_at
      FROM analytics_cache 
      WHERE cache_key = $1 AND expires_at > NOW()
    `, [cacheKey]);

    if (cached.rows.length > 0) {
      res.json({
        data: cached.rows[0].cache_data,
        cached: true,
        expires_at: cached.rows[0].expires_at,
        created_at: cached.rows[0].created_at
      });
    } else {
      res.status(404).json({ error: 'Cache not found or expired' });
    }
  } catch (error) {
    logger.error('Error getting cached analytics:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Health check for the analytics system
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbResult = await pool.query('SELECT COUNT(*) FROM walmart_sales');
    const recordCount = parseInt(dbResult.rows[0].count);

    // Check if Gemini API key is configured
    const geminiConfigured = !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);

    res.json({
      status: 'healthy',
      database: {
        connected: true,
        recordCount
      },
      gemini: {
        configured: geminiConfigured
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
