export declare class PredictiveModelsService {
    generateForecast(tenantId: string, metric: string, timeframe: number): Promise<{
        metric: string;
        forecast: {
            period: string;
            predicted: number;
            confidence: number;
        }[];
        accuracy: number;
        modelType: string;
    }>;
    detectAnomalies(tenantId: string, data: any[]): Promise<{
        timestamp: Date;
        metric: string;
        value: number;
        expectedRange: {
            min: number;
            max: number;
        };
        severity: string;
        description: string;
    }[]>;
    getModelStatus(tenantId: string): Promise<{
        salesForecast: {
            status: string;
            lastTrained: Date;
            accuracy: number;
        };
        anomalyDetection: {
            status: string;
            lastTrained: Date;
            accuracy: number;
        };
        churnPrediction: {
            status: string;
            lastTrained: null;
            accuracy: null;
        };
    }>;
}
//# sourceMappingURL=predictiveModelsService.d.ts.map