"use strict";
/**
 * Query Service
 * Handles database operations for query processing, execution, and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryService = void 0;
const client_1 = require("@prisma/client");
const query_1 = require("@shared/types/query");
const logger_js_1 = require("../config/logger.js");
class QueryService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    /**
     * Execute SQL query and return formatted results
     */
    async executeQuery(sqlQuery, context) {
        try {
            logger_js_1.logger.info(`Executing query for tenant ${context.tenantId}`);
            // Execute the raw SQL query
            const rawResults = await this.prisma.$queryRawUnsafe(sqlQuery);
            if (!Array.isArray(rawResults) || rawResults.length === 0) {
                return [{
                        id: `result_${Date.now()}`,
                        data: [],
                        summary: 'No data found for the specified criteria.',
                        visualizationType: query_1.VisualizationType.TABLE,
                        insights: [],
                        metadata: {
                            totalRows: 0,
                            columns: [],
                            executionTime: 0,
                            dataFreshness: new Date(),
                            hasMore: false
                        }
                    }];
            }
            // Analyze results and determine best visualization
            const visualizationType = this.determineVisualization(rawResults, sqlQuery);
            // Generate insights from the data
            const insights = await this.generateInsights(rawResults, context);
            // Create column metadata
            const columns = this.extractColumnMetadata(rawResults[0]);
            // Generate summary
            const summary = this.generateSummary(rawResults, visualizationType);
            const result = {
                id: `result_${Date.now()}`,
                data: rawResults,
                summary,
                visualizationType,
                chartConfig: this.generateChartConfig(rawResults, visualizationType),
                insights,
                metadata: {
                    totalRows: rawResults.length,
                    columns,
                    executionTime: 100, // Would be measured in real implementation
                    dataFreshness: new Date(),
                    hasMore: false
                }
            };
            return [result];
        }
        catch (error) {
            logger_js_1.logger.error('Error executing query:', error);
            throw new Error(`Query execution failed: ${error.message}`);
        }
    }
    /**
     * Save processed query to database
     */
    async saveQuery(query) {
        try {
            // In a real implementation, this would save to a queries table
            // For now, we'll log it
            logger_js_1.logger.info(`Saving query ${query.id} for user ${query.userId}`);
            // Mock implementation - would use Prisma to save to database
            // await this.prisma.query.create({ data: query });
        }
        catch (error) {
            logger_js_1.logger.error('Error saving query:', error);
            throw new Error(`Failed to save query: ${error.message}`);
        }
    }
    /**
     * Get user's query history with pagination
     */
    async getQueryHistory(userId, tenantId, pagination) {
        try {
            // Mock implementation - would query database for user's query history
            const mockQueries = [
                {
                    queryId: 'query_1',
                    query: 'Show me sales trends for the last 6 months',
                    timestamp: new Date(Date.now() - 86400000), // 1 day ago
                    executionTime: 150,
                    resultCount: 100,
                    isFavorite: false,
                    tags: ['sales', 'trends']
                },
                {
                    queryId: 'query_2',
                    query: 'Which products are underperforming this quarter?',
                    timestamp: new Date(Date.now() - 172800000), // 2 days ago
                    executionTime: 200,
                    resultCount: 25,
                    isFavorite: true,
                    tags: ['products', 'performance']
                }
            ];
            return {
                userId,
                tenantId,
                queries: mockQueries.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit),
                totalQueries: mockQueries.length,
                favoriteQueries: ['query_2'],
                recentSearches: [
                    'sales trends',
                    'product performance',
                    'customer acquisition'
                ],
                queryFrequency: [
                    {
                        query: 'sales trends',
                        count: 5,
                        lastUsed: new Date(),
                        avgExecutionTime: 150
                    }
                ]
            };
        }
        catch (error) {
            logger_js_1.logger.error('Error fetching query history:', error);
            throw new Error(`Failed to fetch query history: ${error.message}`);
        }
    }
    /**
     * Toggle favorite status for a query
     */
    async toggleFavorite(queryId, userId) {
        try {
            logger_js_1.logger.info(`Toggling favorite status for query ${queryId} by user ${userId}`);
            // Mock implementation - would update database
        }
        catch (error) {
            logger_js_1.logger.error('Error toggling favorite:', error);
            throw new Error(`Failed to toggle favorite: ${error.message}`);
        }
    }
    /**
     * Get query templates for a specific industry
     */
    async getQueryTemplates(industry) {
        try {
            // Mock templates based on industry
            const templates = [
                {
                    id: 'template_1',
                    name: 'Sales Performance Analysis',
                    template: 'Show me {metric} performance for {time_period} by {dimension}',
                    category: 'TEMPLATE',
                    industry: industry,
                    variables: [
                        {
                            name: 'metric',
                            type: 'ENUM',
                            required: true,
                            options: [
                                { value: 'sales', label: 'Sales' },
                                { value: 'revenue', label: 'Revenue' },
                                { value: 'profit', label: 'Profit' }
                            ]
                        },
                        {
                            name: 'time_period',
                            type: 'ENUM',
                            required: true,
                            options: [
                                { value: 'last month', label: 'Last Month' },
                                { value: 'last quarter', label: 'Last Quarter' },
                                { value: 'last 6 months', label: 'Last 6 Months' }
                            ]
                        },
                        {
                            name: 'dimension',
                            type: 'ENUM',
                            required: false,
                            defaultValue: 'product',
                            options: [
                                { value: 'product', label: 'Product' },
                                { value: 'region', label: 'Region' },
                                { value: 'channel', label: 'Sales Channel' }
                            ]
                        }
                    ],
                    examples: [
                        'Show me sales performance for last quarter by product',
                        'Show me revenue performance for last month by region'
                    ],
                    description: 'Analyze sales performance across different dimensions and time periods'
                },
                {
                    id: 'template_2',
                    name: 'Customer Analysis',
                    template: 'What is our {metric} for {segment} customers in {time_period}?',
                    category: 'TEMPLATE',
                    industry: industry,
                    variables: [
                        {
                            name: 'metric',
                            type: 'ENUM',
                            required: true,
                            options: [
                                { value: 'acquisition cost', label: 'Acquisition Cost' },
                                { value: 'lifetime value', label: 'Lifetime Value' },
                                { value: 'retention rate', label: 'Retention Rate' }
                            ]
                        },
                        {
                            name: 'segment',
                            type: 'ENUM',
                            required: false,
                            defaultValue: 'new',
                            options: [
                                { value: 'new', label: 'New' },
                                { value: 'existing', label: 'Existing' },
                                { value: 'premium', label: 'Premium' }
                            ]
                        },
                        {
                            name: 'time_period',
                            type: 'ENUM',
                            required: true,
                            options: [
                                { value: 'this month', label: 'This Month' },
                                { value: 'this quarter', label: 'This Quarter' },
                                { value: 'this year', label: 'This Year' }
                            ]
                        }
                    ],
                    examples: [
                        'What is our acquisition cost for new customers this quarter?',
                        'What is our retention rate for premium customers this year?'
                    ],
                    description: 'Analyze customer metrics and segmentation'
                }
            ];
            return templates;
        }
        catch (error) {
            logger_js_1.logger.error('Error fetching query templates:', error);
            throw new Error(`Failed to fetch query templates: ${error.message}`);
        }
    }
    /**
     * Submit feedback for a query result
     */
    async submitQueryFeedback(queryId, userId, feedback) {
        try {
            logger_js_1.logger.info(`Submitting feedback for query ${queryId} from user ${userId}`);
            // Mock implementation - would save feedback to database
        }
        catch (error) {
            logger_js_1.logger.error('Error submitting feedback:', error);
            throw new Error(`Failed to submit feedback: ${error.message}`);
        }
    }
    // ==================== Private Helper Methods ====================
    determineVisualization(data, sqlQuery) {
        if (!data || data.length === 0)
            return query_1.VisualizationType.TABLE;
        const query = sqlQuery.toLowerCase();
        const firstRow = data[0];
        const columns = Object.keys(firstRow);
        // Check for time-based data
        const hasTimeColumn = columns.some(col => col.includes('date') || col.includes('time') || col.includes('created_at'));
        // Check for numeric aggregations
        const hasNumericValue = columns.some(col => typeof firstRow[col] === 'number' &&
            (col.includes('sum') || col.includes('count') || col.includes('avg')));
        // Determine best visualization based on query patterns and data
        if (query.includes('trend') || (hasTimeColumn && hasNumericValue)) {
            return query_1.VisualizationType.LINE_CHART;
        }
        if (query.includes('compare') || query.includes('group by')) {
            return data.length <= 10 ? query_1.VisualizationType.BAR_CHART : query_1.VisualizationType.TABLE;
        }
        if (query.includes('top') || query.includes('rank') || query.includes('order by')) {
            return query_1.VisualizationType.BAR_CHART;
        }
        if (columns.length <= 3 && data.length <= 20) {
            return query_1.VisualizationType.PIE_CHART;
        }
        return query_1.VisualizationType.TABLE;
    }
    async generateInsights(data, context) {
        // Mock insight generation - would use AI to analyze data patterns
        const insights = [];
        if (data.length > 0) {
            // Sample insight based on data analysis
            insights.push({
                type: query_1.InsightType.TREND,
                title: 'Data Pattern Detected',
                description: `Analysis of ${data.length} records shows interesting patterns in your business data.`,
                confidence: 0.8,
                significance: query_1.InsightSignificance.MEDIUM,
                recommendations: [
                    'Consider analyzing this data over a longer time period',
                    'Look for seasonal patterns in your metrics'
                ]
            });
        }
        return insights;
    }
    extractColumnMetadata(sampleRow) {
        return Object.entries(sampleRow).map(([key, value]) => ({
            name: key,
            type: this.inferColumnType(value),
            description: this.generateColumnDescription(key)
        }));
    }
    inferColumnType(value) {
        if (value === null)
            return 'STRING';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
        }
        if (typeof value === 'boolean')
            return 'BOOLEAN';
        if (value instanceof Date)
            return 'DATE';
        if (typeof value === 'string') {
            // Check if it's a date string
            if (!isNaN(Date.parse(value)))
                return 'DATETIME';
            // Check if it's a currency
            if (value.startsWith('$') || value.includes('USD'))
                return 'CURRENCY';
            // Check if it's a percentage
            if (value.endsWith('%'))
                return 'PERCENTAGE';
        }
        return 'STRING';
    }
    generateColumnDescription(columnName) {
        const descriptions = {
            'id': 'Unique identifier',
            'name': 'Name or title',
            'value': 'Numeric value or amount',
            'date': 'Date and time',
            'created_at': 'Creation timestamp',
            'updated_at': 'Last update timestamp',
            'sales': 'Sales amount',
            'revenue': 'Revenue generated',
            'customers': 'Number of customers',
            'products': 'Number of products'
        };
        return descriptions[columnName.toLowerCase()] || `${columnName} data`;
    }
    generateSummary(data, visualizationType) {
        const rowCount = data.length;
        const columns = Object.keys(data[0] || {});
        let summary = `Found ${rowCount} record${rowCount !== 1 ? 's' : ''} with ${columns.length} field${columns.length !== 1 ? 's' : ''}.`;
        // Add visualization-specific summary
        switch (visualizationType) {
            case query_1.VisualizationType.LINE_CHART:
                summary += ' The data shows trends over time.';
                break;
            case query_1.VisualizationType.BAR_CHART:
                summary += ' The data compares values across categories.';
                break;
            case query_1.VisualizationType.PIE_CHART:
                summary += ' The data shows proportional relationships.';
                break;
            default:
                summary += ' The data is displayed in tabular format.';
        }
        return summary;
    }
    generateChartConfig(data, visualizationType) {
        if (!data || data.length === 0)
            return null;
        const columns = Object.keys(data[0]);
        const numericColumns = columns.filter(col => typeof data[0][col] === 'number');
        const categoryColumns = columns.filter(col => typeof data[0][col] === 'string' || col.includes('date'));
        return {
            type: visualizationType,
            xAxis: {
                field: categoryColumns[0] || columns[0],
                label: categoryColumns[0] || 'Category',
                type: 'CATEGORY'
            },
            yAxis: {
                field: numericColumns[0] || columns[1],
                label: numericColumns[0] || 'Value',
                type: 'VALUE'
            },
            series: numericColumns.slice(0, 3).map(field => ({
                field,
                name: field.charAt(0).toUpperCase() + field.slice(1),
                type: 'LINE',
                aggregation: 'SUM'
            })),
            styling: {
                theme: 'LIGHT',
                colors: ['#3B82F6', '#10B981', '#F59E0B'],
                showLegend: true,
                showGrid: true,
                showTooltip: true,
                responsive: true
            },
            interactive: true
        };
    }
}
exports.QueryService = QueryService;
//# sourceMappingURL=queryService.js.map