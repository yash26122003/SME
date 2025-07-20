/**
 * Natural Language Query Processor Service
 * Handles AI-powered natural language to SQL conversion using Gemini 2.0 Flash
 * Implements sophisticated query understanding and generation for SME business intelligence
 */

import {
  NLQuery,
  ProcessedQuery,
  QueryContext,
  AIQueryProcessor,
  ValidationResult,
  QueryIntent,
  QueryEntity,
  EntityType,
  QueryTimeframe,
  TimeframeType,
  RelativeTimeframe,
  QueryComplexity,
  ErrorType,
  WarningType,
  FilterOperator,
  QueryFilter,
  QueryOrder
} from '@shared/types/query';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../config/logger.js';
import { BusinessMetric } from '@shared/types';

/**
 * Advanced Natural Language Query Processor
 * Uses Gemini 2.0 Flash for understanding business questions and generating SQL queries
 */
export class NaturalLanguageQueryProcessor implements AIQueryProcessor {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp' 
    });
  }

  /**
   * Parses user query and extracts intent, entities, and generates structured query
   */
  async parseIntent(query: string, context: QueryContext): Promise<QueryIntent> {
    const prompt = this.buildIntentPrompt(query, context);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse AI response to determine intent
      const intentMatch = text.match(/INTENT:\s*(\w+)/i);
      const intent = intentMatch ? intentMatch[1].toUpperCase() as QueryIntent : QueryIntent.SUMMARY;
      
      logger.info(`Parsed query intent: ${intent} for query: "${query}"`);
      return intent;
    } catch (error) {
      logger.error('Error parsing query intent:', error);
      return QueryIntent.SUMMARY; // Fallback
    }
  }

  /**
   * Extracts entities from natural language query
   */
  async extractEntities(query: string, context: QueryContext): Promise<QueryEntity[]> {
    const prompt = this.buildEntityExtractionPrompt(query, context);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      return this.parseEntitiesFromResponse(text, query);
    } catch (error) {
      logger.error('Error extracting entities:', error);
      return [];
    }
  }

  /**
   * Processes complete query and returns structured format
   */
  async processQuery(query: string, context: QueryContext): Promise<ProcessedQuery> {
    const prompt = this.buildQueryProcessingPrompt(query, context);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      return this.parseProcessedQueryResponse(text, query, context);
    } catch (error) {
      logger.error('Error processing query:', error);
      throw new Error(`Failed to process query: ${error.message}`);
    }
  }

  /**
   * Generates SQL query from processed natural language query
   */
  async generateSQL(processedQuery: ProcessedQuery, context: QueryContext): Promise<string> {
    const prompt = this.buildSQLGenerationPrompt(processedQuery, context);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Extract SQL from response
      const sqlMatch = text.match(/```sql\n([\s\S]*?)\n```/i) || 
                      text.match(/SQL:\s*([\s\S]*?)(?:\n\n|$)/i);
      
      if (!sqlMatch || !sqlMatch[1]) {
        throw new Error('Failed to extract SQL from AI response');
      }
      
      const sql = sqlMatch[1].trim();
      logger.info(`Generated SQL: ${sql}`);
      
      return sql;
    } catch (error) {
      logger.error('Error generating SQL:', error);
      throw new Error(`Failed to generate SQL: ${error.message}`);
    }
  }

  /**
   * Validates generated SQL query for security and performance
   */
  async validateQuery(sqlQuery: string, context: QueryContext): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];
    
    // Basic SQL injection detection
    const dangerousPatterns = [
      /;\s*(drop|delete|insert|update|create|alter)\s+/i,
      /union\s+select/i,
      /exec\s*\(/i,
      /xp_\w+/i,
      /sp_\w+/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sqlQuery)) {
        errors.push({
          type: ErrorType.SYNTAX_ERROR,
          message: 'Potentially dangerous SQL detected',
          suggestion: 'Query contains unsafe operations'
        });
      }
    }
    
    // Complexity estimation
    const complexity = this.estimateQueryComplexity(sqlQuery);
    
    if (complexity === QueryComplexity.VERY_HIGH) {
      warnings.push({
        type: WarningType.PERFORMANCE,
        message: 'Query complexity is very high',
        suggestion: 'Consider simplifying the query or adding filters'
      });
    }
    
    // Resource usage estimation
    const resourceUsage = this.estimateResourceUsage(sqlQuery, complexity);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      estimatedCost: {
        estimatedRows: this.estimateRowCount(sqlQuery),
        estimatedTime: resourceUsage.estimatedTime,
        complexity,
        resourceUsage: {
          cpuUnits: resourceUsage.cpuUnits,
          memoryMB: resourceUsage.memoryMB,
          ioOperations: resourceUsage.ioOperations
        }
      }
    };
  }

  /**
   * Generates human-friendly explanation of the query
   */
  async explainQuery(processedQuery: ProcessedQuery): Promise<string> {
    const prompt = `
      Explain this business intelligence query in simple terms for a non-technical user:
      
      Intent: ${processedQuery.intent}
      Metrics: ${processedQuery.metrics.join(', ')}
      Time Frame: ${JSON.stringify(processedQuery.timeframe)}
      Filters: ${JSON.stringify(processedQuery.filters)}
      
      Provide a clear, concise explanation of what data will be retrieved and how it will be analyzed.
    `;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text().trim();
    } catch (error) {
      logger.error('Error explaining query:', error);
      return 'This query analyzes your business data based on the specified criteria.';
    }
  }

  /**
   * Generates query suggestions based on partial input
   */
  async generateSuggestions(partialQuery: string, context: QueryContext): Promise<string[]> {
    const prompt = this.buildSuggestionsPrompt(partialQuery, context);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse suggestions from response
      const suggestions = text
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\.)/))
        .map(line => line.replace(/^[-\d\.\s]+/, '').trim())
        .filter(suggestion => suggestion.length > 0)
        .slice(0, 10); // Limit to 10 suggestions
      
      return suggestions;
    } catch (error) {
      logger.error('Error generating suggestions:', error);
      return this.getFallbackSuggestions(context.industry);
    }
  }

  // ==================== Private Helper Methods ====================

  private buildIntentPrompt(query: string, context: QueryContext): string {
    return `
      You are an AI assistant specialized in business intelligence for ${context.industry} companies.
      
      Analyze this business query and determine the primary intent:
      Query: "${query}"
      
      Available intents:
      - TREND_ANALYSIS: Looking at changes over time
      - COMPARISON: Comparing different entities or time periods
      - AGGREGATION: Summarizing or totaling data
      - FILTERING: Finding specific subsets of data
      - RANKING: Ordering or finding top/bottom performers
      - FORECASTING: Predicting future values
      - ANOMALY_DETECTION: Finding unusual patterns
      - DRILL_DOWN: Getting more detailed information
      - SUMMARY: General overview or summary
      - CORRELATION: Finding relationships between metrics
      
      Respond with: INTENT: [INTENT_NAME]
    `;
  }

  private buildEntityExtractionPrompt(query: string, context: QueryContext): string {
    const metrics = context.availableMetrics.map(m => m.name).join(', ');
    
    return `
      Extract entities from this business query:
      Query: "${query}"
      
      Available metrics: ${metrics}
      
      Entity types to identify:
      - METRIC: Business metrics (sales, revenue, customers, etc.)
      - TIME_PERIOD: Time references (last month, Q1, 2024, etc.)
      - COMPARISON_OPERATOR: Comparison words (greater than, top, best, etc.)
      - FILTER_VALUE: Specific values to filter by
      - BUSINESS_ENTITY: Products, regions, channels, etc.
      
      Format: ENTITY_TYPE: value (confidence: 0.0-1.0) [start_index-end_index]
    `;
  }

  private buildQueryProcessingPrompt(query: string, context: QueryContext): string {
    const metricsContext = context.availableMetrics
      .map(m => `${m.name} (${m.category}): ${m.unit}`)
      .join('\n');
    
    return `
      You are a business intelligence expert. Process this natural language query into a structured format.
      
      Query: "${query}"
      Industry: ${context.industry}
      
      Available metrics:
      ${metricsContext}
      
      Please provide:
      1. INTENT: Primary query intent
      2. METRICS: List of relevant metrics
      3. TIMEFRAME: Time period analysis
      4. FILTERS: Any filtering conditions
      5. GROUPING: How to group the data
      6. SORTING: How to order results
      7. EXPLANATION: What the query is asking for
      
      Format your response as structured JSON.
    `;
  }

  private buildSQLGenerationPrompt(processedQuery: ProcessedQuery, context: QueryContext): string {
    return `
      Generate a PostgreSQL query based on this processed business intelligence request:
      
      Intent: ${processedQuery.intent}
      Metrics: ${processedQuery.metrics.join(', ')}
      Timeframe: ${JSON.stringify(processedQuery.timeframe)}
      Filters: ${JSON.stringify(processedQuery.filters)}
      Group By: ${processedQuery.groupBy.join(', ')}
      Order By: ${JSON.stringify(processedQuery.orderBy)}
      
      Database schema:
      - business_metrics table with columns: id, tenant_id, name, value, category, period, timestamp
      - Tenant ID should always be filtered: tenant_id = '${context.tenantId}'
      
      Requirements:
      - Use proper PostgreSQL syntax
      - Include security measures (parameterized queries)
      - Optimize for performance
      - Handle NULL values appropriately
      
      Provide only the SQL query wrapped in ```sql``` blocks.
    `;
  }

  private buildSuggestionsPrompt(partialQuery: string, context: QueryContext): string {
    return `
      Generate query suggestions for a ${context.industry} business based on this partial input:
      Partial Query: "${partialQuery}"
      
      Suggest 8-10 complete, actionable business questions that:
      1. Are relevant to ${context.industry} businesses
      2. Can be answered with business intelligence data
      3. Are commonly asked by SME business owners
      4. Complete or expand on the partial query
      
      Format as a numbered list of complete questions.
    `;
  }

  private parseEntitiesFromResponse(response: string, query: string): QueryEntity[] {
    const entities: QueryEntity[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*([^(]+)\s*\(confidence:\s*([0-9.]+)\)\s*\[(\d+)-(\d+)\]/);
      if (match) {
        const [, type, value, confidence, start, end] = match;
        entities.push({
          type: type as EntityType,
          value: value.trim(),
          confidence: parseFloat(confidence),
          startIndex: parseInt(start),
          endIndex: parseInt(end)
        });
      }
    }
    
    return entities;
  }

  private parseProcessedQueryResponse(response: string, originalQuery: string, context: QueryContext): ProcessedQuery {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/i) || 
                       response.match(/\{[\s\S]*\}/i);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return this.mapToProcessedQuery(parsed, originalQuery);
      }
      
      // Fallback to manual parsing
      return this.manualParseResponse(response, originalQuery);
    } catch (error) {
      logger.error('Error parsing processed query response:', error);
      return this.createFallbackProcessedQuery(originalQuery);
    }
  }

  private mapToProcessedQuery(parsed: any, originalQuery: string): ProcessedQuery {
    return {
      intent: parsed.intent || QueryIntent.SUMMARY,
      entities: parsed.entities || [],
      timeframe: parsed.timeframe || { type: TimeframeType.RELATIVE, relative: RelativeTimeframe.LAST_30_DAYS },
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
      filters: Array.isArray(parsed.filters) ? parsed.filters : [],
      groupBy: Array.isArray(parsed.groupBy) ? parsed.groupBy : [],
      orderBy: Array.isArray(parsed.orderBy) ? parsed.orderBy : [],
      sqlQuery: '',
      explanation: parsed.explanation || 'Business data analysis query',
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    };
  }

  private manualParseResponse(response: string, originalQuery: string): ProcessedQuery {
    // Simple manual parsing as fallback
    const lines = response.toLowerCase();
    
    let intent = QueryIntent.SUMMARY;
    if (lines.includes('trend') || lines.includes('over time')) intent = QueryIntent.TREND_ANALYSIS;
    else if (lines.includes('compare') || lines.includes('vs')) intent = QueryIntent.COMPARISON;
    else if (lines.includes('total') || lines.includes('sum')) intent = QueryIntent.AGGREGATION;
    
    return {
      intent,
      entities: [],
      timeframe: { type: TimeframeType.RELATIVE, relative: RelativeTimeframe.LAST_30_DAYS },
      metrics: [],
      filters: [],
      groupBy: [],
      orderBy: [],
      sqlQuery: '',
      explanation: 'Business data analysis based on your query',
      suggestions: []
    };
  }

  private createFallbackProcessedQuery(originalQuery: string): ProcessedQuery {
    return {
      intent: QueryIntent.SUMMARY,
      entities: [],
      timeframe: { type: TimeframeType.RELATIVE, relative: RelativeTimeframe.LAST_30_DAYS },
      metrics: [],
      filters: [],
      groupBy: [],
      orderBy: [],
      sqlQuery: '',
      explanation: 'General business data summary',
      suggestions: []
    };
  }

  private estimateQueryComplexity(sqlQuery: string): QueryComplexity {
    const query = sqlQuery.toLowerCase();
    let complexity = 0;
    
    // Count complexity factors
    if (query.includes('join')) complexity += 2;
    if (query.includes('subquery') || query.includes('select') && query.split('select').length > 2) complexity += 3;
    if (query.includes('group by')) complexity += 1;
    if (query.includes('having')) complexity += 1;
    if (query.includes('order by')) complexity += 1;
    if (query.includes('window') || query.includes('over(')) complexity += 2;
    
    if (complexity <= 2) return QueryComplexity.LOW;
    if (complexity <= 5) return QueryComplexity.MEDIUM;
    if (complexity <= 8) return QueryComplexity.HIGH;
    return QueryComplexity.VERY_HIGH;
  }

  private estimateResourceUsage(sqlQuery: string, complexity: QueryComplexity) {
    const baseTime = 100; // milliseconds
    const baseCpu = 1;
    const baseMemory = 64; // MB
    const baseIO = 5;
    
    const multipliers = {
      [QueryComplexity.LOW]: 1,
      [QueryComplexity.MEDIUM]: 2,
      [QueryComplexity.HIGH]: 4,
      [QueryComplexity.VERY_HIGH]: 8
    };
    
    const multiplier = multipliers[complexity];
    
    return {
      estimatedTime: baseTime * multiplier,
      cpuUnits: baseCpu * multiplier,
      memoryMB: baseMemory * multiplier,
      ioOperations: baseIO * multiplier
    };
  }

  private estimateRowCount(sqlQuery: string): number {
    // Simple heuristic for row count estimation
    const query = sqlQuery.toLowerCase();
    
    if (query.includes('limit')) {
      const limitMatch = query.match(/limit\s+(\d+)/);
      if (limitMatch) return parseInt(limitMatch[1]);
    }
    
    // Default estimates based on common patterns
    if (query.includes('where') && query.includes('timestamp')) return 1000;
    if (query.includes('group by')) return 50;
    
    return 500; // Default estimate
  }

  private getFallbackSuggestions(industry: string): string[] {
    const commonSuggestions = [
      'Show me sales trends for the last 6 months',
      'Compare revenue by month this year',
      'Which products are our best sellers?',
      'What is our customer acquisition cost?',
      'Show monthly recurring revenue growth',
      'Analyze seasonal patterns in sales',
      'Compare performance across different regions',
      'Generate a cash flow forecast'
    ];
    
    return commonSuggestions;
  }
}

// Export singleton instance
export const nlQueryProcessor = new NaturalLanguageQueryProcessor();

