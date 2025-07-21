import { Pool } from 'pg';
export declare class WalmartDataLoader {
    private pool;
    constructor(pool: Pool);
    loadWalmartSalesData(): Promise<{
        success: boolean;
        recordsLoaded: number;
        errors: string[];
    }>;
    private initializeTables;
    private insertBatch;
    private parseDate;
    updateAnalyticsCache(): Promise<void>;
    getDataSummary(): Promise<any>;
}
//# sourceMappingURL=dataLoader.d.ts.map