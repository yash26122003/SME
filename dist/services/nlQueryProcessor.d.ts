/**
 * Natural Language Query Processor Service
 * Handles AI-powered natural language to SQL conversion using Gemini 2.0 Flash
 * Implements sophisticated query understanding and generation for SME business intelligence
 */
import { ProcessedQuery, QueryContext, AIQueryProcessor, ValidationResult, QueryIntent, QueryEntity } from '@shared/types/query';
/**
 * Advanced Natural Language Query Processor
 * Uses Gemini 2.0 Flash for understanding business questions and generating SQL queries
 */
export declare class NaturalLanguageQueryProcessor implements AIQueryProcessor {
    private genAI;
    private model;
    constructor();
    /**
     * Parses user query and extracts intent, entities, and generates structured query
     */
    parseIntent(query: string, context: QueryContext): Promise<QueryIntent>;
    /**
     * Extracts entities from natural language query
     */
    extractEntities(query: string, context: QueryContext): Promise<QueryEntity[]>;
    /**
     * Processes complete query and returns structured format
     */
    processQuery(query: string, context: QueryContext): Promise<ProcessedQuery>;
    /**
     * Generates SQL query from processed natural language query
     */
    generateSQL(processedQuery: ProcessedQuery, context: QueryContext): Promise<string>;
    /**
     * Validates generated SQL query for security and performance
     */
    validateQuery(sqlQuery: string, context: QueryContext): Promise<ValidationResult>;
    /**
     * Generates human-friendly explanation of the query
     */
    explainQuery(processedQuery: ProcessedQuery): Promise<string>;
    /**
     * Generates query suggestions based on partial input
     */
    generateSuggestions(partialQuery: string, context: QueryContext): Promise<string[]>;
    private buildIntentPrompt;
    private buildEntityExtractionPrompt;
    private buildQueryProcessingPrompt;
    private buildSQLGenerationPrompt;
    private buildSuggestionsPrompt;
    private parseEntitiesFromResponse;
    private parseProcessedQueryResponse;
    private mapToProcessedQuery;
    private manualParseResponse;
    private createFallbackProcessedQuery;
    private estimateQueryComplexity;
    private estimateResourceUsage;
    private estimateRowCount;
    private getFallbackSuggestions;
}
export declare const nlQueryProcessor: NaturalLanguageQueryProcessor;
//# sourceMappingURL=nlQueryProcessor.d.ts.map