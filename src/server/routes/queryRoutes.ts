/**
 * Query Routes
 * API endpoints for natural language query processing and management
 */

import { Router } from 'express';
import { nlQueryProcessor } from '../services/nlQueryProcessor';
import { QueryService } from '../services/queryService';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { validateQueryRequest } from '../middleware/validation';
import { APIResponse } from '../../shared/types';
import {
  NLQuery,
  QueryStatus,
  ProcessedQuery,
  QueryResult,
  AutoCompleteResult,
  QueryHistory,
  QuerySuggestion,
  SuggestionCategory
} from '../../shared/types/query';
import { logger } from '../utils/logger';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Apply rate limiting for AI operations
router.use('/process', rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  message: 'Too many query requests, please try again later.'
}));

/**
 * POST /api/queries/demo
 * Demo endpoint with mock analytics responses
 */
router.post('/demo', async (req, res) => {
  try {
    const { query } = req.body;
    const startTime = Date.now();

    // Generate mock analytics response based on query keywords
    const lowerQuery = query.toLowerCase();
    let mockResponse;

    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
      mockResponse = {
        analysis: {
          title: "Sales & Revenue Analysis",
          summary: "Sales performance shows strong growth with Q4 leading at 35% increase YoY.",
          insights: [
            "Monthly revenue increased by 23% compared to last year",
            "Top performing product categories: Electronics (40%), Clothing (28%), Home & Garden (22%)",
            "Peak sales periods: December, June, and September"
          ],
          data: [
            { month: "Jan", revenue: 45000, growth: 15 },
            { month: "Feb", revenue: 52000, growth: 18 },
            { month: "Mar", revenue: 48000, growth: 12 },
            { month: "Apr", revenue: 61000, growth: 27 },
            { month: "May", revenue: 58000, growth: 22 },
            { month: "Jun", revenue: 71000, growth: 35 }
          ],
          chartType: "line_chart"
        }
      };
    } else if (lowerQuery.includes('customer') || lowerQuery.includes('user')) {
      mockResponse = {
        analysis: {
          title: "Customer Analytics",
          summary: "Customer base growing steadily with improved retention rates and engagement.",
          insights: [
            "Customer retention rate improved to 87% (up 12% from last quarter)",
            "New customer acquisition increased by 31%",
            "Average customer lifetime value: $2,847",
            "Most engaged demographics: 25-34 age group (42% of interactions)"
          ],
          data: [
            { segment: "New Customers", count: 1247, percentage: 31 },
            { segment: "Returning Customers", count: 3891, percentage: 69 },
            { segment: "Premium Customers", count: 876, percentage: 22 },
            { segment: "At Risk", count: 234, percentage: 6 }
          ],
          chartType: "donut_chart"
        }
      };
    } else if (lowerQuery.includes('product') || lowerQuery.includes('inventory')) {
      mockResponse = {
        analysis: {
          title: "Product Performance Analysis",
          summary: "Product portfolio showing strong performance in key categories with inventory optimization opportunities.",
          insights: [
            "Top 5 products account for 67% of total revenue",
            "Inventory turnover rate: 8.2x annually",
            "23 products showing declining trends - recommend discontinuation",
            "New product launches generated $187K in revenue"
          ],
          data: [
            { product: "Wireless Headphones", sales: 1847, revenue: 129890 },
            { product: "Smartphone Case", sales: 2156, revenue: 64680 },
            { product: "Laptop Stand", sales: 987, revenue: 78960 },
            { product: "USB Cable", sales: 3421, revenue: 47894 },
            { product: "Power Bank", sales: 1654, revenue: 82700 }
          ],
          chartType: "bar_chart"
        }
      };
    } else if (lowerQuery.includes('trend') || lowerQuery.includes('forecast')) {
      mockResponse = {
        analysis: {
          title: "Business Trends & Forecasting",
          summary: "Current trends indicate sustained growth with seasonal patterns emerging.",
          insights: [
            "Revenue growth trend: +18% quarterly average",
            "Seasonal peak expected in Q4 (November-December)",
            "Customer acquisition cost decreased by 24%",
            "Projected annual growth: 22-27% based on current trajectory"
          ],
          data: [
            { period: "Q1 2024", actual: 234000, forecast: 231000, growth: 18 },
            { period: "Q2 2024", actual: 267000, forecast: 265000, growth: 22 },
            { period: "Q3 2024", actual: null, forecast: 298000, growth: 25 },
            { period: "Q4 2024", actual: null, forecast: 334000, growth: 27 }
          ],
          chartType: "forecast_chart"
        }
      };
    } else {
      // Generic business overview
      mockResponse = {
        analysis: {
          title: "Business Overview Dashboard",
          summary: "Comprehensive business performance metrics showing positive trends across key indicators.",
          insights: [
            "Overall business health score: 8.4/10 (Excellent)",
            "Revenue growth: +23% YoY",
            "Customer satisfaction: 94% (up 7% from last quarter)",
            "Market share expansion: +5.2% in target demographics"
          ],
          data: [
            { metric: "Revenue", value: 987654, change: 23, status: "positive" },
            { metric: "Customers", value: 5847, change: 31, status: "positive" },
            { metric: "Orders", value: 12934, change: 18, status: "positive" },
            { metric: "Avg Order Value", value: 127.50, change: -3, status: "negative" }
          ],
          chartType: "dashboard"
        }
      };
    }

    const processingTime = Date.now() - startTime;

    const demoQuery = {
      id: `demo_${Date.now()}`,
      query,
      ...mockResponse,
      processingTime,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        query: demoQuery,
        executionTime: processingTime
      }
    });

  } catch (error) {
    logger.error('Error processing demo query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process demo query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/queries/process
 * Process natural language query and return structured results
 */
router.post('/process', validateQueryRequest, async (req, res) => {
  try {
    const { query, context } = req.body;
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User ID and tenant ID are required'
      } as APIResponse);
    }

    logger.info(`Processing query: "${query}" for user ${userId}`);

    // Create query context
    const queryContext = {
      tenantId,
      userId,
      industry: context?.industry || (req.user?.tenant?.industry as any),
      availableMetrics: context?.availableMetrics || [],
      previousQueries: context?.previousQueries || [],
      userPreferences: context?.userPreferences || {
        defaultTimeframe: 'relative' as any,
        preferredVisualization: 'line_chart' as any,
        detailLevel: 'medium' as any,
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
    const processedQuery = await nlQueryProcessor.processQuery(query, queryContext);
    
    // Generate SQL from processed query
    const sqlQuery = await nlQueryProcessor.generateSQL(processedQuery, queryContext);
    
    // Validate the generated SQL
    const validation = await nlQueryProcessor.validateQuery(sqlQuery, queryContext);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query generated',
        data: {
          errors: validation.errors,
          warnings: validation.warnings
        }
      } as APIResponse);
    }

    // Execute query and get results (this would integrate with your database service)
    const queryService = new QueryService();
    const results = await queryService.executeQuery(sqlQuery, queryContext);

    // Generate explanation
    const explanation = await nlQueryProcessor.explainQuery(processedQuery);

    const processingTime = Date.now() - startTime;

    // Save query to database (implement QueryService.saveQuery)
    const savedQuery: NLQuery = {
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
      status: QueryStatus.COMPLETED,
      confidence: 0.85,
      processingTime,
      tokensUsed: Math.floor(query.length / 4), // Rough estimate
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await queryService.saveQuery(savedQuery);

    logger.info(`Query processed successfully in ${processingTime}ms`);

    res.json({
      success: true,
      data: {
        query: savedQuery,
        validation,
        executionTime: processingTime
      }
    } as APIResponse);

  } catch (error) {
    logger.error('Error processing query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process query',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as APIResponse);
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

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User ID and tenant ID are required'
      } as APIResponse);
    }

    if (!partialQuery) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      } as APIResponse);
    }

    const queryContext = {
      tenantId,
      userId,
      industry: (req.user?.tenant?.industry as any) || 'OTHER',
      availableMetrics: [], // Would be populated from database
      previousQueries: [],
      userPreferences: {
        defaultTimeframe: 'relative' as any,
        preferredVisualization: 'line_chart' as any,
        detailLevel: 'medium' as any,
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

    const suggestions = await nlQueryProcessor.generateSuggestions(
      partialQuery as string, 
      queryContext
    );

    const result: AutoCompleteResult = {
      suggestions: suggestions.slice(0, Number(limit)).map((text, index) => ({
        id: `suggestion_${index}`,
        text,
        category: SuggestionCategory.RECOMMENDED,
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
    } as APIResponse<AutoCompleteResult>);

  } catch (error) {
    logger.error('Error generating suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    } as APIResponse);
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

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User ID and tenant ID are required'
      } as APIResponse);
    }

    const queryService = new QueryService();
    const history = await queryService.getQueryHistory(
      userId,
      tenantId,
      {
        page: Number(page),
        limit: Number(limit)
      }
    );

    res.json({
      success: true,
      data: history,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: history.totalQueries,
        hasMore: history.queries.length === Number(limit)
      }
    } as APIResponse<QueryHistory>);

  } catch (error) {
    logger.error('Error fetching query history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query history'
    } as APIResponse);
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

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User ID is required'
      } as APIResponse);
    }

    const queryService = new QueryService();
    await queryService.toggleFavorite(id, userId);

    res.json({
      success: true,
      message: 'Favorite status updated'
    } as APIResponse);

  } catch (error) {
    logger.error('Error updating favorite status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update favorite status'
    } as APIResponse);
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

    const queryService = new QueryService();
    const templates = await queryService.getQueryTemplates(userIndustry as string);

    res.json({
      success: true,
      data: templates
    } as APIResponse);

  } catch (error) {
    logger.error('Error fetching query templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query templates'
    } as APIResponse);
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

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User ID is required'
      } as APIResponse);
    }

    const queryService = new QueryService();
    await queryService.submitQueryFeedback(id, userId, {
      helpful,
      accurate,
      comment
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    } as APIResponse);

  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    } as APIResponse);
  }
});

export default router;
