/**
 * Advanced Analytics Types
 * Types for predictive analytics dashboard and SME business intelligence
 */

export interface TimeSeriesData {
  date: Date;
  value: number;
  predicted?: boolean;
  confidence?: {
    lower: number;
    upper: number;
  };
}

export interface SalesForecasting {
  id: string;
  tenantId: string;
  historical: TimeSeriesData[];
  predictions: TimeSeriesData[];
  accuracy: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    r2: number; // R-squared
  };
  seasonality: {
    detected: boolean;
    period: number; // in days
    strength: number; // 0-1
  };
  model: 'ARIMA' | 'Prophet' | 'Linear' | 'Exponential';
  lastUpdated: Date;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  averageCLV: number;
  churnRate: number;
  characteristics: Record<string, any>;
  color: string;
}

export interface CustomerAnalytics {
  id: string;
  tenantId: string;
  segments: CustomerSegment[];
  clvDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  churnPredictions: {
    customerId: string;
    customerName: string;
    churnProbability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    recommendedActions: string[];
  }[];
  purchasePatterns: {
    pattern: string;
    frequency: number;
    seasonality: boolean;
    averageOrderValue: number;
  }[];
}

export interface FinancialHealthIndicator {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  target?: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendations: string[];
}

export interface CashFlowForecast {
  id: string;
  tenantId: string;
  scenarios: {
    name: string;
    type: 'OPTIMISTIC' | 'REALISTIC' | 'PESSIMISTIC';
    cashFlow: TimeSeriesData[];
    assumptions: Record<string, any>;
  }[];
  alerts: {
    id: string;
    type: 'NEGATIVE_CASH_FLOW' | 'LOW_RESERVES' | 'SEASONAL_RISK';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    date: Date;
    resolved: boolean;
  }[];
}

export interface ProfitabilityAnalysis {
  id: string;
  tenantId: string;
  byProduct: {
    productId: string;
    productName: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  }[];
  byService: {
    serviceId: string;
    serviceName: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  }[];
  overall: {
    grossMargin: number;
    netMargin: number;
    operatingMargin: number;
    trends: TimeSeriesData[];
  };
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: WidgetConfig;
  data?: any;
  loading?: boolean;
  error?: string;
  lastUpdated?: Date;
}

export type WidgetType = 
  | 'SALES_FORECAST'
  | 'CUSTOMER_CLV'
  | 'CHURN_PREDICTION'
  | 'CASH_FLOW'
  | 'PROFITABILITY'
  | 'KPI_CARD'
  | 'TREND_CHART'
  | 'PIE_CHART'
  | 'BAR_CHART'
  | 'HEATMAP'
  | 'GAUGE'
  | 'TABLE';

export interface WidgetConfig {
  timeRange?: string;
  filters?: Record<string, any>;
  chartType?: string;
  showPredictions?: boolean;
  showConfidenceIntervals?: boolean;
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  groupBy?: string;
  compareWith?: string;
  refreshInterval?: number; // in seconds
  exportFormats?: ('PDF' | 'Excel' | 'PNG')[];
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  industry?: string;
  widgets: Omit<DashboardWidget, 'data' | 'loading' | 'error' | 'lastUpdated'>[];
  layout: {
    breakpoints: Record<string, number>;
    cols: Record<string, number>;
    rowHeight: number;
  };
  tags: string[];
  isDefault?: boolean;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  previousValue?: number;
  change: number;
  changePercent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  category: string;
  description: string;
  calculationMethod: string;
}

export interface Alert {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  actions?: {
    label: string;
    action: string;
  }[];
  source: string;
  category: string;
}

export interface AnalyticsDashboard {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: any; // react-grid-layout format
  settings: {
    refreshInterval: number;
    theme: 'LIGHT' | 'DARK';
    currency: string;
    timezone: string;
    dateFormat: string;
    numberFormat: string;
  };
  sharing: {
    isPublic: boolean;
    sharedWith: string[];
    accessLevel: 'VIEW' | 'EDIT';
  };
  isDefault: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'SALES_FORECAST' | 'CUSTOMER_CHURN' | 'CASH_FLOW' | 'DEMAND_FORECAST';
  algorithm: string;
  features: string[];
  accuracy: {
    training: number;
    validation: number;
    test: number;
  };
  lastTrained: Date;
  status: 'TRAINING' | 'READY' | 'ERROR' | 'OUTDATED';
  hyperparameters: Record<string, any>;
  metrics: Record<string, number>;
}

export interface BusinessInsight {
  id: string;
  type: 'OPPORTUNITY' | 'RISK' | 'TREND' | 'ANOMALY' | 'RECOMMENDATION';
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-1
  category: string;
  source: string;
  data: any;
  actionable: boolean;
  actions?: string[];
  priority: number; // 1-10
  createdAt: Date;
  expiresAt?: Date;
}

export interface ExportConfig {
  format: 'PDF' | 'Excel' | 'PNG' | 'CSV';
  orientation?: 'portrait' | 'landscape';
  includeCharts: boolean;
  includeTables: boolean;
  includeInsights: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  template?: string;
  customizations?: Record<string, any>;
}

// Industry-specific templates
export interface IndustryTemplate {
  id: string;
  industry: string;
  name: string;
  description: string;
  kpis: Partial<KPI>[];
  widgets: Partial<DashboardWidget>[];
  alerts: Partial<Alert>[];
  insights: string[]; // Common insight patterns
}

// Multi-currency support
export interface CurrencyConfig {
  primary: string;
  supported: string[];
  exchangeRates: Record<string, number>;
  lastUpdated: Date;
  displayFormat: {
    symbol: string;
    position: 'before' | 'after';
    decimalPlaces: number;
    thousandsSeparator: string;
    decimalSeparator: string;
  };
}

// Real-time updates
export interface RealTimeUpdate {
  type: 'WIDGET_UPDATE' | 'ALERT' | 'INSIGHT' | 'DATA_REFRESH';
  widgetId?: string;
  data: any;
  timestamp: Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Integration types
export interface IntegrationConfig {
  provider: 'QuickBooks' | 'Xero' | 'Stripe' | 'PayPal' | 'Shopify' | 'WooCommerce';
  credentials: Record<string, string>;
  mappings: Record<string, string>;
  syncFrequency: number; // in minutes
  lastSync: Date;
  status: 'CONNECTED' | 'ERROR' | 'SYNCING' | 'DISCONNECTED';
  dataTypes: string[];
}
