export declare class AnalyticsService {
    getAnalytics(tenantId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        revenue: number;
        growth: number;
        customers: number;
        orders: number;
    }>;
    getFinancialMetrics(tenantId: string): Promise<{
        date: string;
        revenue: number;
        expenses: number;
        cash_flow: number;
        budget_variance: number;
    }[]>;
    getSalesData(tenantId: string): Promise<{
        totalSales: number;
        salesGrowth: number;
        topProducts: {
            name: string;
            sales: number;
        }[];
    }>;
}
//# sourceMappingURL=analyticsService.d.ts.map