/**
 * Query Service
 * Handles database operations for query processing, execution, and management
 */
import { NLQuery, QueryContext, QueryResult, QueryHistory, QueryTemplate } from '@shared/types/query';
import { PaginationParams } from '@shared/types';
export declare class QueryService {
    private prisma;
    constructor();
    /**
     * Execute SQL query and return formatted results
     */
    executeQuery(sqlQuery: string, context: QueryContext): Promise<QueryResult[]>;
    /**
     * Save processed query to database
     */
    saveQuery(query: NLQuery): Promise<void>;
    /**
     * Get user's query history with pagination
     */
    getQueryHistory(userId: string, tenantId: string, pagination: PaginationParams): Promise<QueryHistory>;
    /**
     * Toggle favorite status for a query
     */
    toggleFavorite(queryId: string, userId: string): Promise<void>;
    /**
     * Get query templates for a specific industry
     */
    getQueryTemplates(industry: string): Promise<QueryTemplate[]>;
    /**
     * Submit feedback for a query result
     */
    submitQueryFeedback(queryId: string, userId: string, feedback: {
        helpful: boolean;
        accurate: boolean;
        comment?: string;
    }): Promise<void>;
    private determineVisualization;
    private generateInsights;
    private extractColumnMetadata;
    private inferColumnType;
    private generateColumnDescription;
    private generateSummary;
    private generateChartConfig;
}
//# sourceMappingURL=queryService.d.ts.map