import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface SalesForecast {
  date: string;
  predicted: number;
  actual?: number;
  confidence_lower: number;
  confidence_upper: number;
  seasonal_trend: 'up' | 'down' | 'stable';
}

export interface CustomerAnalytics {
  customer_id: string;
  clv_prediction: number;
  churn_probability: number;
  risk_level: 'low' | 'medium' | 'high';
  segment: string;
  last_purchase_days: number;
  total_purchases: number;
  avg_order_value: number;
}

export interface FinancialMetrics {
  date: string;
  cash_flow: number;
  predicted_cash_flow: number;
  revenue: number;
  expenses: number;
  profit_margin: number;
  budget_variance: number;
}

export interface DashboardConfig {
  layout: 'grid' | 'flex' | 'custom';
  widgets: {
    id: string;
    type: 'sales' | 'customer' | 'financial' | 'chart';
    position: { x: number; y: number; w: number; h: number };
    visible: boolean;
  }[];
  dateRange: {
    start: string;
    end: string;
  };
  currency: string;
  industry: string;
}

export interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
  };
  productLines?: string[];
  customerSegments?: string[];
  regions?: string[];
  currency: string;
}

interface AnalyticsState {
  // Data
  salesForecasts: SalesForecast[];
  customerAnalytics: CustomerAnalytics[];
  financialMetrics: FinancialMetrics[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Configuration
  dashboardConfig: DashboardConfig;
  filters: AnalyticsFilters;
  
  // Real-time updates
  isRealTimeEnabled: boolean;
  websocketConnected: boolean;
  
  // Actions
  setSalesForecasts: (forecasts: SalesForecast[]) => void;
  setCustomerAnalytics: (analytics: CustomerAnalytics[]) => void;
  setFinancialMetrics: (metrics: FinancialMetrics[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<AnalyticsFilters>) => void;
  updateDashboardConfig: (config: Partial<DashboardConfig>) => void;
  toggleRealTime: () => void;
  setWebsocketStatus: (connected: boolean) => void;
  refreshData: () => Promise<void>;
  exportData: (format: 'pdf' | 'excel' | 'csv') => Promise<void>;
  resetDashboard: () => void;
}

const defaultConfig: DashboardConfig = {
  layout: 'grid',
  widgets: [
    { id: 'sales-forecast', type: 'sales', position: { x: 0, y: 0, w: 6, h: 4 }, visible: true },
    { id: 'customer-clv', type: 'customer', position: { x: 6, y: 0, w: 6, h: 4 }, visible: true },
    { id: 'financial-cash-flow', type: 'financial', position: { x: 0, y: 4, w: 12, h: 4 }, visible: true },
  ],
  dateRange: {
    start: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  currency: 'USD',
  industry: 'general',
};

const defaultFilters: AnalyticsFilters = {
  dateRange: {
    start: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  currency: 'USD',
};

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      salesForecasts: [],
      customerAnalytics: [],
      financialMetrics: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
      dashboardConfig: defaultConfig,
      filters: defaultFilters,
      isRealTimeEnabled: false,
      websocketConnected: false,

      // Actions
      setSalesForecasts: (forecasts) =>
        set({ salesForecasts: forecasts, lastUpdated: new Date() }),

      setCustomerAnalytics: (analytics) =>
        set({ customerAnalytics: analytics, lastUpdated: new Date() }),

      setFinancialMetrics: (metrics) =>
        set({ financialMetrics: metrics, lastUpdated: new Date() }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      updateDashboardConfig: (config) =>
        set((state) => ({
          dashboardConfig: { ...state.dashboardConfig, ...config },
        })),

      toggleRealTime: () =>
        set((state) => ({
          isRealTimeEnabled: !state.isRealTimeEnabled,
        })),

      setWebsocketStatus: (connected) =>
        set({ websocketConnected: connected }),

      refreshData: async () => {
        const state = get();
        set({ isLoading: true, error: null });
        
        try {
          // This will be implemented to fetch data from APIs
          const response = await fetch('/api/v1/analytics/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filters: state.filters }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to refresh data');
          }
          
          const data = await response.json();
          
          set({
            salesForecasts: data.sales || [],
            customerAnalytics: data.customers || [],
            financialMetrics: data.financial || [],
            lastUpdated: new Date(),
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      exportData: async (format) => {
        const state = get();
        set({ isLoading: true });
        
        try {
          const response = await fetch(`/api/v1/analytics/export/${format}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: {
                sales: state.salesForecasts,
                customers: state.customerAnalytics,
                financial: state.financialMetrics,
              },
              config: state.dashboardConfig,
              filters: state.filters,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to export ${format}`);
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-dashboard.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Export failed',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      resetDashboard: () =>
        set({
          salesForecasts: [],
          customerAnalytics: [],
          financialMetrics: [],
          dashboardConfig: defaultConfig,
          filters: defaultFilters,
          error: null,
          lastUpdated: null,
        }),
    }),
    { name: 'analytics-store' }
  )
);
