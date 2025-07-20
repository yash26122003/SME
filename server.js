/**
 * Simple Mock Server for Development
 * Provides basic API endpoints to test the frontend
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Business AI Platform API is running',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Mock query processing endpoint
app.post('/api/queries/process', (req, res) => {
  const { query } = req.body;
  
  console.log(`Received query: "${query}"`);
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        query: {
          id: `query_${Date.now()}`,
          tenantId: 'mock_tenant',
          userId: 'mock_user',
          rawQuery: query,
          processedQuery: {
            intent: 'TREND_ANALYSIS',
            explanation: `This query analyzes "${query}" to provide business insights.`,
            sqlQuery: 'SELECT * FROM mock_data WHERE created_at >= NOW() - INTERVAL 6 MONTH;',
            entities: [],
            timeframe: { type: 'RELATIVE', relative: 'LAST_6_MONTHS' },
            metrics: ['sales', 'revenue'],
            filters: [],
            groupBy: [],
            orderBy: [],
            suggestions: [
              'Try asking about specific time periods',
              'Consider comparing different metrics',
              'Look at seasonal patterns'
            ]
          },
          results: [{
            id: 'result_1',
            summary: `Found interesting insights for your query: "${query}"`,
            visualizationType: 'LINE_CHART',
            data: [
              { month: 'Jan', sales: 12000, revenue: 15000 },
              { month: 'Feb', sales: 13500, revenue: 16200 },
              { month: 'Mar', sales: 11800, revenue: 14500 },
              { month: 'Apr', sales: 15200, revenue: 18000 },
              { month: 'May', sales: 14800, revenue: 17600 },
              { month: 'Jun', sales: 16500, revenue: 19800 }
            ],
            insights: [
              {
                type: 'TREND',
                title: 'Positive Growth Trend',
                description: 'Your business shows consistent growth over the analyzed period.',
                confidence: 0.85,
                significance: 'HIGH',
                recommendations: [
                  'Continue current marketing strategies',
                  'Consider expanding successful product lines',
                  'Monitor seasonal variations for planning'
                ]
              }
            ],
            metadata: {
              totalRows: 6,
              columns: [
                { name: 'month', type: 'STRING', description: 'Time period' },
                { name: 'sales', type: 'CURRENCY', description: 'Sales amount' },
                { name: 'revenue', type: 'CURRENCY', description: 'Revenue generated' }
              ],
              executionTime: 150,
              dataFreshness: new Date(),
              hasMore: false
            }
          }],
          status: 'COMPLETED',
          confidence: 0.85,
          processingTime: 150,
          tokensUsed: Math.floor(query.length / 4),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    });
  }, 1500); // 1.5 second delay to simulate processing
});

// Mock suggestions endpoint
app.get('/api/queries/suggestions', (req, res) => {
  const { q } = req.query;
  
  const suggestions = [
    'Show me sales trends for the last 6 months',
    'Which products are underperforming this quarter?',
    'Compare customer acquisition costs across marketing channels',
    'Generate a cash flow forecast for next month',
    'What is our customer retention rate?',
    'Analyze seasonal patterns in sales',
    'Show revenue by product category',
    'Compare this year vs last year performance'
  ].filter(suggestion => 
    !q || suggestion.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 5);
  
  res.json({
    success: true,
    data: {
      suggestions: suggestions.map((text, index) => ({
        id: `suggestion_${index}`,
        text,
        category: 'RECOMMENDED',
        popularity: 0.8,
        relevance: 0.9,
        examples: [],
        description: `AI-suggested query: ${text}`
      })),
      completions: suggestions,
      entities: [],
      confidence: 0.8,
      processingTime: 50
    }
  });
});

// Mock history endpoint
app.get('/api/queries/history', (req, res) => {
  res.json({
    success: true,
    data: {
      userId: 'mock_user',
      tenantId: 'mock_tenant',
      queries: [
        {
          queryId: 'query_1',
          query: 'Show me sales trends for the last 6 months',
          timestamp: new Date(Date.now() - 86400000),
          executionTime: 150,
          resultCount: 100,
          isFavorite: false,
          tags: ['sales', 'trends']
        },
        {
          queryId: 'query_2',
          query: 'Which products are underperforming this quarter?',
          timestamp: new Date(Date.now() - 172800000),
          executionTime: 200,
          resultCount: 25,
          isFavorite: true,
          tags: ['products', 'performance']
        }
      ],
      totalQueries: 2,
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
    }
  });
});

// Mock feedback endpoint
app.post('/api/queries/:id/feedback', (req, res) => {
  console.log(`Feedback for query ${req.params.id}:`, req.body);
  
  res.json({
    success: true,
    message: 'Feedback submitted successfully'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Business AI Platform server running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
