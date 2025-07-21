"use strict";
/**
 * Analytics Routes
 * API endpoints for advanced predictive analytics and dashboard data
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsService_js_1 = require("../services/analyticsService.js");
const predictiveModelsService_js_1 = require("../services/predictiveModelsService.js");
const auth_js_1 = require("../middleware/auth.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const validation_js_1 = require("../middleware/validation.js");
const logger_js_1 = require("../config/logger.js");
const router = (0, express_1.Router)();
const analyticsService = new analyticsService_js_1.AnalyticsService();
const predictiveModelsService = new predictiveModelsService_js_1.PredictiveModelsService();
// Apply auth middleware to all routes
router.use(auth_js_1.authMiddleware);
// Apply rate limiting for expensive operations
router.use((0, rateLimit_js_1.rateLimitMiddleware)({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute for analytics
    message: 'Too many analytics requests, please try again later.'
}));
/**
 * GET /api/analytics/dashboard/:dashboardId
 * Get complete dashboard data with all widgets
 */
router.get('/dashboard/:dashboardId', async (req, res) => {
    try {
        const { dashboardId } = req.params;
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        logger_js_1.logger.info(`Fetching dashboard data: ${dashboardId} for tenant: ${tenantId}`);
        const dashboardData = await analyticsService.getDashboardData(dashboardId, tenantId, userId);
        res.json({
            success: true,
            data: dashboardData
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/analytics/sales-forecasting
 * Get sales forecasting data with ARIMA and Prophet models
 */
router.get('/sales-forecasting', validation_js_1.validateAnalyticsRequest, async (req, res) => {
    try {
        const { timeRange = '6months', model = 'Prophet', includeConfidence = true } = req.query;
        const tenantId = req.user?.tenantId;
        logger_js_1.logger.info(`Generating sales forecast for tenant: ${tenantId}, model: ${model}`);
        const forecastData = await predictiveModelsService.generateSalesForecast({
            tenantId,
            timeRange: timeRange,
            model: model,
            includeConfidence: includeConfidence === 'true'
        });
        res.json({
            success: true,
            data: forecastData
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error generating sales forecast:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate sales forecast',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/analytics/customer-analytics
 * Get customer behavior analytics including CLV and churn prediction
 */
router.get('/customer-analytics', async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { includeSegmentation = true, includePredictions = true } = req.query;
        logger_js_1.logger.info(`Generating customer analytics for tenant: ${tenantId}`);
        const customerData = await analyticsService.getCustomerAnalytics({
            tenantId,
            includeSegmentation: includeSegmentation === 'true',
            includePredictions: includePredictions === 'true'
        });
        res.json({
            success: true,
            data: customerData
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error generating customer analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate customer analytics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/analytics/cash-flow-forecast
 * Get cash flow forecasting with multiple scenarios
 */
router.get('/cash-flow-forecast', async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { scenarios = 'realistic,optimistic,pessimistic', timeHorizon = '12months' } = req.query;
        logger_js_1.logger.info(`Generating cash flow forecast for tenant: ${tenantId}`);
        const cashFlowData = await predictiveModelsService.generateCashFlowForecast({
            tenantId,
            scenarios: scenarios.split(','),
            timeHorizon: timeHorizon
        });
        res.json({
            success: true,
            data: cashFlowData
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error generating cash flow forecast:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate cash flow forecast',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/analytics/profitability-analysis
 * Get profitability analysis by products and services
 */
router.get('/profitability-analysis', async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { period = '12months', groupBy = 'product' } = req.query;
        logger_js_1.logger.info(`Generating profitability analysis for tenant: ${tenantId}`);
        const profitabilityData = await analyticsService.getProfitabilityAnalysis({
            tenantId,
            period: period,
            groupBy: groupBy
        });
        res.json({
            success: true,
            data: profitabilityData
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error generating profitability analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate profitability analysis',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/analytics/financial-health
 * Get financial health indicators and KPIs
 */
router.get('/financial-health', async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        logger_js_1.logger.info(`Generating financial health indicators for tenant: ${tenantId}`);
        const financialHealth = await analyticsService.getFinancialHealthIndicators(tenantId);
        res.json({
            success: true,
            data: financialHealth
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error generating financial health indicators:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate financial health indicators',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/analytics/kpis
 * Get key performance indicators for dashboard
 */
router.get('/kpis', async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { period = '30days', category } = req.query;
        const kpis = await analyticsService.getKPIs({
            tenantId,
            period: period,
            category: category
        });
        res.json({
            success: true,
            data: kpis
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error fetching KPIs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch KPIs',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/analytics/alerts
 * Get active alerts and notifications
 */
router.get('/alerts', async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const { unreadOnly = false } = req.query;
        const alerts = await analyticsService.getAlerts({
            tenantId,
            userId,
            unreadOnly: unreadOnly === 'true'
        });
        res.json({
            success: true,
            data: alerts
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch alerts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/analytics/insights
 * Get AI-generated business insights
 */
router.get('/insights', async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { limit = 10, priority = 'all' } = req.query;
        logger_js_1.logger.info(`Generating AI insights for tenant: ${tenantId}`);
        const insights = await analyticsService.generateInsights({
            tenantId,
            limit: parseInt(limit),
            priority: priority
        });
        res.json({
            success: true,
            data: insights
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error generating insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate insights',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/analytics/custom-query
 * Process custom analytics queries using Gemini AI
 */
router.post('/custom-query', async (req, res) => {
    try {
        const { query, context } = req.body;
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        logger_js_1.logger.info(`Processing custom analytics query for tenant: ${tenantId}`);
        const result = await analyticsService.processCustomQuery({
            tenantId,
            userId,
            query,
            context
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error processing custom query:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process custom query',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/analytics/export
 * Export dashboard or specific widgets
 */
router.post('/export', async (req, res) => {
    try {
        const { dashboardId, widgetIds, format, config } = req.body;
        const tenantId = req.user?.tenantId;
        logger_js_1.logger.info(`Exporting dashboard data: ${dashboardId}, format: ${format}`);
        const exportResult = await analyticsService.exportDashboard({
            tenantId,
            dashboardId,
            widgetIds,
            format,
            config
        });
        // Set appropriate headers for download
        const contentTypes = {
            'PDF': 'application/pdf',
            'Excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'PNG': 'image/png',
            'CSV': 'text/csv'
        };
        res.setHeader('Content-Type', contentTypes[format] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename=dashboard-export.${format.toLowerCase()}`);
        res.send(exportResult);
    }
    catch (error) {
        logger_js_1.logger.error('Error exporting dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export dashboard',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * PUT /api/analytics/alerts/:alertId/read
 * Mark alert as read
 */
router.put('/alerts/:alertId/read', async (req, res) => {
    try {
        const { alertId } = req.params;
        const userId = req.user?.id;
        await analyticsService.markAlertAsRead(alertId, userId);
        res.json({
            success: true,
            message: 'Alert marked as read'
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error marking alert as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark alert as read',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * DELETE /api/analytics/insights/:insightId
 * Dismiss an insight
 */
router.delete('/insights/:insightId', async (req, res) => {
    try {
        const { insightId } = req.params;
        const userId = req.user?.id;
        await analyticsService.dismissInsight(insightId, userId);
        res.json({
            success: true,
            message: 'Insight dismissed'
        });
    }
    catch (error) {
        logger_js_1.logger.error('Error dismissing insight:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to dismiss insight',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analyticsRoutes.js.map