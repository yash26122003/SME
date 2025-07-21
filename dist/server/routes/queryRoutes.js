"use strict";
/**
 * Query Routes
 * API endpoints for natural language query processing and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nlQueryProcessor_js_1 = require("../services/nlQueryProcessor.js");
const queryService_js_1 = require("../services/queryService.js");
const auth_js_1 = require("../middleware/auth.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const validation_js_1 = require("../middleware/validation.js");
const query_1 = require("@shared/types/query");
const logger_js_1 = require("../config/logger.js");
const router = (0, express_1.Router)();
// Apply auth middleware to all routes
router.use(auth_js_1.authMiddleware);
// Apply rate limiting for AI operations
router.use('/process', (0, rateLimit_js_1.rateLimitMiddleware)({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 requests per minute
    message: 'Too many query requests, please try again later.'
}));
/**
 * POST /api/queries/process
 * Process natural language query and return structured results
 */
router.post('/process', validation_js_1.validateQueryRequest, async (req, res) => {
    try {
        const { query, context } = req.body;
        const userId = req.user?.id;
        const tenantId = req.user?.tenantId;
        logger_js_1.logger.info(`Processing query: "${query}" for user ${userId}`);
        // Create query context
        const queryContext = {
            tenantId,
            userId,
            industry: context?.industry || req.user?.tenant?.industry,
            availableMetrics: context?.availableMetrics || [],
            previousQueries: context?.previousQueries || [],
            userPreferences: context?.userPreferences || {
                defaultTimeframe: 'RELATIVE',
                preferredVisualization: 'LINE_CHART',
                detailLevel: 'MEDIUM',
                includeInsights: true,
                includeRecommendations: true,
                language: 'en'
            },
            sessionContext: {
                conversationId: context?.conversationId || `session_${Date.now()}`,
                previousQueries: [],
                contextVariables: {},
                clarificationHistory: []
            }
        };
        // Start query processing
        const startTime = Date.now();
        // Process the natural language query
        const processedQuery = await nlQueryProcessor_js_1.nlQueryProcessor.processQuery(query, queryContext);
        // Generate SQL from processed query
        const sqlQuery = await nlQueryProcessor_js_1.nlQueryProcessor.generateSQL(processedQuery, queryContext);
        // Validate the generated SQL
        const validation = await nlQueryProcessor_js_1.nlQueryProcessor.validateQuery(sqlQuery, queryContext);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query generated',
                data: {
                    errors: validation.errors,
                    warnings: validation.warnings
                }
            });
        }
        // Execute query and get results (this would integrate with your database service)
        const queryService = new queryService_js_1.QueryService();
        const results = await queryService.executeQuery(sqlQuery, queryContext);
        // Generate explanation
        const explanation = await nlQueryProcessor_js_1.nlQueryProcessor.explainQuery(processedQuery);
        const processingTime = Date.now() - startTime;
        // Save query to database (implement QueryService.saveQuery)
        const savedQuery = {
            id: `query_${Date.now()}`,
            tenantId,
            userId,
            rawQuery: query,
            processedQuery: {
                ...processedQuery,
                sqlQuery,
                explanation
            },
            results,
            status: query_1.QueryStatus.COMPLETED,
            confidence: 0.85,
            processingTime,
            tokensUsed: Math.floor(query.length / 4), // Rough estimate
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await queryService.saveQuery(savedQuery);
        logger_js_1.logger.info(`Query processed successfully in ${processingTime}ms`);
        res.json({
            success: true,
            data: {
                query: savedQuery,
                validation,
                executionTime: processingTime
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error processing query:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process query',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/queries/suggestions
 * Get query suggestions based on partial input
 */
router.get('/suggestions', async (req, res) => {
    try {
        const { q: partialQuery, limit = 10 } = req.query;
        const userId = req.user?.id;
        const tenantId = req.user?.tenantId;
        if (!partialQuery) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required'
            });
        }
        const queryContext = {
            tenantId,
            userId,
            industry: req.user?.tenant?.industry || 'OTHER',
            availableMetrics: [], // Would be populated from database
            previousQueries: [],
            userPreferences: {
                defaultTimeframe: 'RELATIVE',
                preferredVisualization: 'LINE_CHART',
                detailLevel: 'MEDIUM',
                includeInsights: true,
                includeRecommendations: true,
                language: 'en'
            },
            sessionContext: {
                conversationId: `session_${Date.now()}`,
                previousQueries: [],
                contextVariables: {},
                clarificationHistory: []
            }
        };
        const suggestions = await nlQueryProcessor_js_1.nlQueryProcessor.generateSuggestions(partialQuery, queryContext);
        const result = {
            suggestions: suggestions.slice(0, Number(limit)).map((text, index) => ({
                id: `suggestion_${index}`,
                text,
                category: query_1.SuggestionCategory.RECOMMENDED,
                popularity: 0.8,
                relevance: 0.9,
                examples: [],
                description: `AI-suggested query: ${text}`
            })),
            completions: suggestions.slice(0, Number(limit)),
            entities: [],
            confidence: 0.8,
            processingTime: 100
        };
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error generating suggestions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate suggestions'
        });
    }
});
/**
 * GET /api/queries/history
 * Get user's query history
 */
router.get('/history', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user?.id;
        const tenantId = req.user?.tenantId;
        const queryService = new queryService_js_1.QueryService();
        const history = await queryService.getQueryHistory(userId, tenantId, {
            page: Number(page),
            limit: Number(limit)
        });
        res.json({
            success: true,
            data: history,
            meta: {
                page: Number(page),
                limit: Number(limit),
                total: history.totalQueries,
                hasMore: history.queries.length === Number(limit)
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error fetching query history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch query history'
        });
    }
});
/**
 * POST /api/queries/:id/favorite
 * Toggle favorite status of a query
 */
router.post('/:id/favorite', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const queryService = new queryService_js_1.QueryService();
        await queryService.toggleFavorite(id, userId);
        res.json({
            success: true,
            message: 'Favorite status updated'
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error updating favorite status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update favorite status'
        });
    }
});
/**
 * GET /api/queries/templates
 * Get available query templates based on industry
 */
router.get('/templates', async (req, res) => {
    try {
        const { industry } = req.query;
        const userIndustry = industry || req.user?.tenant?.industry || 'OTHER';
        const queryService = new queryService_js_1.QueryService();
        const templates = await queryService.getQueryTemplates(userIndustry);
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error fetching query templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch query templates'
        });
    }
});
/**
 * POST /api/queries/:id/feedback
 * Submit feedback for a query result
 */
router.post('/:id/feedback', async (req, res) => {
    try {
        const { id } = req.params;
        const { helpful, accurate, comment } = req.body;
        const userId = req.user?.id;
        const queryService = new queryService_js_1.QueryService();
        await queryService.submitQueryFeedback(id, userId, {
            helpful,
            accurate,
            comment
        });
        res.json({
            success: true,
            message: 'Feedback submitted successfully'
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback'
        });
    }
});
exports.default = router;
//# sourceMappingURL=queryRoutes.js.map