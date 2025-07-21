/**
 * Dashboard Store
 * Zustand store for managing dashboard state and analytics data
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  AnalyticsDashboard, 
  DashboardWidget, 
  KPI, 
  Alert, 
  BusinessInsight,
  SalesForecasting,
  CustomerAnalytics,
  CashFlowForecast,
  ProfitabilityAnalysis,
  RealTimeUpdate
} from '@shared/types/analytics';

interface DashboardState {
  // Dashboard data
  currentDashboard: AnalyticsDashboard | null;
  dashboards: AnalyticsDashboard[];
  widgets: Record<string, DashboardWidget>;
  
  // Analytics data
  salesForecasting: SalesForecasting | null;
  customerAnalytics: CustomerAnalytics | null;
  cashFlowForecast: CashFlowForecast | null;
  profitabilityAnalysis: ProfitabilityAnalysis | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  selectedDateRange: { start: Date; end: Date };
  filters: Record<string, any>;
  
  // KPIs and alerts
  kpis: KPI[];
  alerts: Alert[];
  insights: BusinessInsight[];
  
  // Real-time updates
  isRealTimeEnabled: boolean;
  lastUpdate: Date | null;
  
  // Actions
  setCurrentDashboard: (dashboard: AnalyticsDashboard) => void;
  addWidget: (widget: DashboardWidget) => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  removeWidget: (widgetId: string) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  
  // Data fetching
  fetchDashboardData: (dashboardId: string) => Promise<void>;
  fetchSalesForecasting: (timeRange?: string) => Promise<void>;
  fetchCustomerAnalytics: () => Promise<void>;
  fetchCashFlowForecast: (scenarios?: string[]) => Promise<void>;
  fetchProfitabilityAnalysis: () => Promise<void>;
  
  // Real-time updates
  enableRealTime: () => void;
  disableRealTime: () => void;
  processRealTimeUpdate: (update: RealTimeUpdate) => void;
  
  // Filters and settings
  setDateRange: (start: Date, end: Date) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  
  // Alerts and insights
  markAlertAsRead: (alertId: string) => void;
  dismissInsight: (insightId: string) => void;
  
  // Export functionality
  exportDashboard: (config: any) => Promise<void>;
  
  // Reset and cleanup
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentDashboard: null,
      dashboards: [],
      widgets: {},
      salesForecasting: null,
      customerAnalytics: null,
      cashFlowForecast: null,
      profitabilityAnalysis: null,
      loading: false,
      error: null,
      selectedDateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      },
      filters: {},
      kpis: [],
      alerts: [],
      insights: [],
      isRealTimeEnabled: false,
      lastUpdate: null,

      // Dashboard actions
      setCurrentDashboard: (dashboard) => {
        set({ currentDashboard: dashboard });
      },

      addWidget: (widget) => {
        set((state) => ({
          widgets: { ...state.widgets, [widget.id]: widget },
          currentDashboard: state.currentDashboard 
            ? { ...state.currentDashboard, widgets: [...state.currentDashboard.widgets, widget] }
            : null
        }));
      },

      updateWidget: (widgetId, updates) => {
        set((state) => ({
          widgets: {
            ...state.widgets,
            [widgetId]: { ...state.widgets[widgetId], ...updates }
          }
        }));
      },

      removeWidget: (widgetId) => {
        set((state) => {
          const newWidgets = { ...state.widgets };
          delete newWidgets[widgetId];
          
          return {
            widgets: newWidgets,
            currentDashboard: state.currentDashboard
              ? {
                  ...state.currentDashboard,
                  widgets: state.currentDashboard.widgets.filter(w => w.id !== widgetId)
                }
              : null
          };
        });
      },

      reorderWidgets: (widgets) => {
        set((state) => ({
          currentDashboard: state.currentDashboard
            ? { ...state.currentDashboard, widgets }
            : null
        }));
      },

      // Data fetching actions
      fetchDashboardData: async (dashboardId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await fetch(`/api/dashboards/${dashboardId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
          }

          const data = await response.json();
          
          set({
            currentDashboard: data.dashboard,
            widgets: data.widgets,
            kpis: data.kpis || [],
            alerts: data.alerts || [],
            insights: data.insights || [],
            loading: false,
            lastUpdate: new Date()
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false 
          });
        }
      },

      fetchSalesForecasting: async (timeRange = '6months') => {
        try {
          const response = await fetch(`/api/analytics/sales-forecasting?timeRange=${timeRange}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch sales forecasting data');
          }

          const data = await response.json();
          set({ salesForecasting: data });
        } catch (error) {
          console.error('Error fetching sales forecasting:', error);
        }
      },

      fetchCustomerAnalytics: async () => {
        try {
          const response = await fetch('/api/analytics/customer-analytics', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch customer analytics data');
          }

          const data = await response.json();
          set({ customerAnalytics: data });
        } catch (error) {
          console.error('Error fetching customer analytics:', error);
        }
      },

      fetchCashFlowForecast: async (scenarios = ['realistic', 'optimistic', 'pessimistic']) => {
        try {
          const response = await fetch(`/api/analytics/cash-flow-forecast?scenarios=${scenarios.join(',')}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch cash flow forecast data');
          }

          const data = await response.json();
          set({ cashFlowForecast: data });
        } catch (error) {
          console.error('Error fetching cash flow forecast:', error);
        }
      },

      fetchProfitabilityAnalysis: async () => {
        try {
          const response = await fetch('/api/analytics/profitability-analysis', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch profitability analysis data');
          }

          const data = await response.json();
          set({ profitabilityAnalysis: data });
        } catch (error) {
          console.error('Error fetching profitability analysis:', error);
        }
      },

      // Real-time updates
      enableRealTime: () => {
        set({ isRealTimeEnabled: true });
        
        // Initialize WebSocket connection for real-time updates
        if (typeof window !== 'undefined') {
          const ws = new WebSocket(`${process.env.WS_URL || 'ws://localhost:3001'}/ws`);
          
          ws.onmessage = (event) => {
            const update: RealTimeUpdate = JSON.parse(event.data);
            get().processRealTimeUpdate(update);
          };
          
          ws.onopen = () => {
            console.log('Real-time updates enabled');
          };
          
          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            set({ isRealTimeEnabled: false });
          };
        }
      },

      disableRealTime: () => {
        set({ isRealTimeEnabled: false });
      },

      processRealTimeUpdate: (update) => {
        switch (update.type) {
          case 'WIDGET_UPDATE':
            if (update.widgetId) {
              get().updateWidget(update.widgetId, { data: update.data, lastUpdated: update.timestamp });
            }
            break;
          
          case 'ALERT':
            set((state) => ({
              alerts: [update.data, ...state.alerts].slice(0, 100) // Keep only latest 100 alerts
            }));
            break;
          
          case 'INSIGHT':
            set((state) => ({
              insights: [update.data, ...state.insights].slice(0, 50) // Keep only latest 50 insights
            }));
            break;
          
          case 'DATA_REFRESH':
            set({ lastUpdate: update.timestamp });
            break;
        }
      },

      // Filters and settings
      setDateRange: (start, end) => {
        set({ selectedDateRange: { start, end } });
      },

      setFilters: (filters) => {
        set({ filters });
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      // Alerts and insights
      markAlertAsRead: (alertId) => {
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === alertId ? { ...alert, read: true } : alert
          )
        }));
      },

      dismissInsight: (insightId) => {
        set((state) => ({
          insights: state.insights.filter(insight => insight.id !== insightId)
        }));
      },

      // Export functionality
      exportDashboard: async (config) => {
        try {
          const response = await fetch('/api/dashboards/export', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              dashboardId: get().currentDashboard?.id,
              config
            })
          });

          if (!response.ok) {
            throw new Error('Failed to export dashboard');
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dashboard-export.${config.format.toLowerCase()}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (error) {
          console.error('Error exporting dashboard:', error);
          set({ error: 'Failed to export dashboard' });
        }
      },

      // Reset state
      reset: () => {
        set({
          currentDashboard: null,
          dashboards: [],
          widgets: {},
          salesForecasting: null,
          customerAnalytics: null,
          cashFlowForecast: null,
          profitabilityAnalysis: null,
          loading: false,
          error: null,
          filters: {},
          kpis: [],
          alerts: [],
          insights: [],
          isRealTimeEnabled: false,
          lastUpdate: null
        });
      }
    }),
    {
      name: 'dashboard-store',
      partialize: (state: DashboardState) => ({
        // Only persist certain parts of the state
        selectedDateRange: state.selectedDateRange,
        filters: state.filters,
        isRealTimeEnabled: state.isRealTimeEnabled
      })
    }
  )
);
