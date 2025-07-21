"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NLPQueryEngine = void 0;
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = require("../utils/logger");
class NLPQueryEngine {
    constructor(pool) {
        this.pool = pool;
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable is required');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    async processNaturalLanguageQuery(query, userId) {
        const startTime = Date.now();
        try {
            logger_1.logger.info(`Processing NLP query: "${query}"`);
            // Get database schema context
            const schemaContext = await this.getSchemaContext();
            // Process query with Gemini
            const geminiResponse = await this.processWithGemini(query, schemaContext);
            // Execute the generated SQL
            let data = [];
            let sqlQuery = '';
            if (geminiResponse.sqlQuery && geminiResponse.sqlQuery !== 'NONE') {
                try {
                    sqlQuery = geminiResponse.sqlQuery;
                    const result = await this.pool.query(sqlQuery);
                    data = result.rows;
                    logger_1.logger.info(`SQL executed successfully, returned ${data.length} rows`);
                }
                catch (sqlError) {
                    logger_1.logger.error('SQL execution error:', sqlError);
                    // Try to fix the SQL with Gemini
                    const fixedQuery = await this.fixSQLWithGemini(sqlQuery, sqlError.message);
                    if (fixedQuery) {
                        try {
                            const retryResult = await this.pool.query(fixedQuery);
                            data = retryResult.rows;
                            sqlQuery = fixedQuery;
                            logger_1.logger.info(`Fixed SQL executed successfully, returned ${data.length} rows`);
                        }
                        catch (retryError) {
                            logger_1.logger.error('Fixed SQL also failed:', retryError);
                        }
                    }
                }
            }
            // Generate insights based on the data
            const insights = await this.generateInsights(query, data, geminiResponse.interpretation);
            const executionTime = Date.now() - startTime;
            // Store query history
            await this.storeQueryHistory({
                userId,
                originalQuery: query,
                interpretedQuery: geminiResponse.interpretation,
                sqlQuery,
                geminiResponse: geminiResponse,
                executionResult: data,
                executionTime
            });
            return {
                success: true,
                query,
                interpretation: geminiResponse.interpretation,
                sqlQuery,
                data,
                insights,
                visualizationType: geminiResponse.visualizationType || 'table',
                executionTime
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing NLP query:', error);
            const executionTime = Date.now() - startTime;
            return {
                success: false,
                query,
                interpretation: 'Failed to process query',
                sqlQuery: '',
                data: [],
                insights: ['Query processing failed. Please try rephrasing your question.'],
                visualizationType: 'error',
                executionTime,
                error: error.message
            };
        }
    }
    async processWithGemini(query, schemaContext) {
        const prompt = `
You are an expert SQL analyst for Walmart sales data analysis. Given a natural language question, generate appropriate SQL query and analysis.

DATABASE SCHEMA:
${schemaContext}

IMPORTANT CONTEXT:
- This is REAL Walmart sales data with stores, dates, weekly sales, holiday flags, temperature, fuel prices, CPI, and unemployment data
- Dates are in YYYY-MM-DD format
- Weekly_sales is in dollars
- Holiday_flag: 1 = holiday week, 0 = regular week
- Store numbers range from 1 to 45
- Data spans from 2010 to 2012

USER QUESTION: "${query}"

Please provide a JSON response with the following structure:
{
  "interpretation": "Clear explanation of what the user is asking",
  "sqlQuery": "Valid PostgreSQL query to answer the question (or 'NONE' if no data needed)",
  "visualizationType": "chart type: 'line', 'bar', 'pie', 'scatter', 'table', 'metric'",
  "reasoning": "Explanation of the SQL approach",
  "expectedInsights": ["List of insights this query should reveal"]
}

RULES:
- Use proper PostgreSQL syntax
- Always use table aliases for clarity
- Include appropriate WHERE clauses, GROUP BY, ORDER BY
- For time series: use DATE_TRUNC for grouping by month/quarter
- For comparisons: use appropriate aggregation functions
- Handle holiday analysis with holiday_flag column
- Consider seasonal patterns in retail data
- Use LIMIT for large result sets
- Return 'NONE' for sqlQuery only if the question doesn't require database querying

Examples:
- "Show me sales trends by month" → GROUP BY DATE_TRUNC('month', date)
- "Which stores perform best?" → GROUP BY store, ORDER BY SUM(weekly_sales) DESC
- "Holiday vs regular sales" → GROUP BY holiday_flag
- "What affects sales the most?" → Correlation analysis between sales and other factors
`;
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Clean and parse JSON response
            let cleanText = text.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.substring(7);
            }
            if (cleanText.endsWith('```')) {
                cleanText = cleanText.substring(0, cleanText.length - 3);
            }
            const parsed = JSON.parse(cleanText);
            logger_1.logger.info('Gemini response parsed successfully');
            return parsed;
        }
        catch (error) {
            logger_1.logger.error('Error with Gemini API:', error);
            // Fallback response
            return {
                interpretation: `Analysis request: ${query}`,
                sqlQuery: 'SELECT COUNT(*) as total_records FROM walmart_sales',
                visualizationType: 'table',
                reasoning: 'Using fallback query due to API error',
                expectedInsights: ['Basic data summary available']
            };
        }
    }
    async fixSQLWithGemini(brokenSQL, errorMessage) {
        const prompt = `
Fix this PostgreSQL query that failed with an error:

BROKEN SQL:
${brokenSQL}

ERROR MESSAGE:
${errorMessage}

DATABASE SCHEMA:
- Table: walmart_sales (store, date, weekly_sales, holiday_flag, temperature, fuel_price, cpi, unemployment)
- Table: store_info (store_id, store_name, location, type, size_sq_ft)

Please provide ONLY the corrected SQL query, no explanation needed.
`;
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const fixedSQL = response.text().trim();
            // Remove markdown formatting if present
            return fixedSQL.replace(/```sql\n?|\n?```/g, '').trim();
        }
        catch (error) {
            logger_1.logger.error('Error fixing SQL with Gemini:', error);
            return null;
        }
    }
    async generateInsights(originalQuery, data, interpretation) {
        if (!data || data.length === 0) {
            return ['No data found for this query. Try adjusting your search criteria.'];
        }
        // Generate basic statistical insights
        const insights = [];
        if (data.length === 1) {
            // Single result - likely an aggregation
            const result = data[0];
            Object.keys(result).forEach(key => {
                const value = result[key];
                if (typeof value === 'number') {
                    if (key.includes('sales') || key.includes('revenue')) {
                        insights.push(`${key}: $${value.toLocaleString()}`);
                    }
                    else if (key.includes('count') || key.includes('total')) {
                        insights.push(`${key}: ${value.toLocaleString()}`);
                    }
                    else if (key.includes('avg') || key.includes('average')) {
                        insights.push(`${key}: ${value.toFixed(2)}`);
                    }
                }
            });
        }
        else {
            // Multiple results - analyze patterns
            insights.push(`Found ${data.length} records matching your criteria`);
            // Look for numerical columns to analyze
            const numericColumns = Object.keys(data[0] || {}).filter(key => typeof data[0][key] === 'number');
            numericColumns.forEach(column => {
                const values = data.map(row => row[column]).filter(val => val != null);
                if (values.length > 0) {
                    const sum = values.reduce((a, b) => a + b, 0);
                    const avg = sum / values.length;
                    const max = Math.max(...values);
                    const min = Math.min(...values);
                    if (column.includes('sales')) {
                        insights.push(`${column}: Range $${min.toLocaleString()} - $${max.toLocaleString()}, Average $${avg.toLocaleString()}`);
                    }
                }
            });
        }
        // Add contextual insights using Gemini
        try {
            const contextPrompt = `
Based on this Walmart sales data analysis, provide 2-3 key business insights in plain English:

QUERY: "${originalQuery}"
INTERPRETATION: "${interpretation}"
RESULT COUNT: ${data.length}
SAMPLE DATA: ${JSON.stringify(data.slice(0, 3))}

Provide practical insights that would be valuable for retail management decisions.
Return as a simple array of strings.
`;
            const result = await this.model.generateContent(contextPrompt);
            const response = await result.response;
            const text = response.text().trim();
            // Try to parse as JSON array, fallback to splitting by lines
            try {
                const aiInsights = JSON.parse(text);
                if (Array.isArray(aiInsights)) {
                    insights.push(...aiInsights);
                }
            }
            catch {
                const lines = text.split('\n').filter(line => line.trim().length > 0);
                insights.push(...lines);
            }
        }
        catch (error) {
            logger_1.logger.error('Error generating AI insights:', error);
        }
        return insights.slice(0, 5); // Limit to top 5 insights
    }
    async getSchemaContext() {
        try {
            const result = await this.pool.query(`
        SELECT 
          table_name, 
          column_name, 
          data_type, 
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('walmart_sales', 'store_info')
        ORDER BY table_name, ordinal_position
      `);
            let schema = "TABLES:\n";
            let currentTable = '';
            result.rows.forEach(row => {
                if (row.table_name !== currentTable) {
                    currentTable = row.table_name;
                    schema += `\n${row.table_name}:\n`;
                }
                schema += `  - ${row.column_name} (${row.data_type})\n`;
            });
            return schema;
        }
        catch (error) {
            logger_1.logger.error('Error getting schema context:', error);
            return `
walmart_sales:
  - store (integer)
  - date (date) 
  - weekly_sales (decimal)
  - holiday_flag (integer)
  - temperature (decimal)
  - fuel_price (decimal)
  - cpi (decimal)
  - unemployment (decimal)

store_info:
  - store_id (integer)
  - store_name (varchar)
  - location (varchar)
  - type (varchar)
  - size_sq_ft (integer)
      `;
        }
    }
    async storeQueryHistory(historyData) {
        try {
            await this.pool.query(`
        INSERT INTO query_history 
        (user_id, original_query, interpreted_query, sql_query, gemini_response, execution_result, execution_time_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
                historyData.userId,
                historyData.originalQuery,
                historyData.interpretedQuery,
                historyData.sqlQuery,
                JSON.stringify(historyData.geminiResponse),
                JSON.stringify(historyData.executionResult),
                historyData.executionTime
            ]);
        }
        catch (error) {
            logger_1.logger.error('Error storing query history:', error);
        }
    }
    async getQueryHistory(userId, limit = 10) {
        try {
            const query = userId
                ? 'SELECT * FROM query_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2'
                : 'SELECT * FROM query_history ORDER BY created_at DESC LIMIT $1';
            const params = userId ? [userId, limit] : [limit];
            const result = await this.pool.query(query, params);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Error getting query history:', error);
            return [];
        }
    }
}
exports.NLPQueryEngine = NLPQueryEngine;
//# sourceMappingURL=nlpQueryEngine.js.map