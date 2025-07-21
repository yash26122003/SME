import { Pool } from 'pg';
export interface QueryResult {
    success: boolean;
    query: string;
    interpretation: string;
    sqlQuery: string;
    data: any[];
    insights: string[];
    visualizationType: string;
    executionTime: number;
    error?: string;
}
export declare class NLPQueryEngine {
    private pool;
    private genAI;
    private model;
    constructor(pool: Pool);
    processNaturalLanguageQuery(query: string, userId?: string): Promise<QueryResult>;
    private processWithGemini;
    private fixSQLWithGemini;
    private generateInsights;
    private getSchemaContext;
    private storeQueryHistory;
    getQueryHistory(userId?: string, limit?: number): Promise<any[]>;
}
//# sourceMappingURL=nlpQueryEngine.d.ts.map