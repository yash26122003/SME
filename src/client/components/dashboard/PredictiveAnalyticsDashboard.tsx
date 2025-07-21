import React, { useEffect, useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './shared/SortableItem';
import SalesForecastingModule from './sales/SalesForecastingModule';
import CustomerBehaviorAnalytics from './customer/CustomerBehaviorAnalytics';
import FinancialHealthIndicators from './financial/FinancialHealthIndicators';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { ExportButton } from './shared/ExportButton';
import { FilterPanel } from './shared/FilterPanel';

interface PredictiveAnalyticsDashboardProps {
  className?: string;
}

const PredictiveAnalyticsDashboard: React.FC<PredictiveAnalyticsDashboardProps> = ({ className = '' }) => {
  const {
    dashboardConfig,
    isLoading,
    error,
    isRealTimeEnabled,
    websocketConnected,
    refreshData,
    toggleRealTime,
    updateDashboardConfig,
    exportData,
    setError,
  } = useAnalyticsStore();

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Websocket connection for real-time updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/analytics`;
    
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          useAnalyticsStore.getState().setWebsocketStatus(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'sales_forecast_update':
                useAnalyticsStore.getState().setSalesForecasts(data.payload);
                break;
              case 'customer_analytics_update':
                useAnalyticsStore.getState().setCustomerAnalytics(data.payload);
                break;
              case 'financial_metrics_update':
                useAnalyticsStore.getState().setFinancialMetrics(data.payload);
                break;
              default:
                console.warn('Unknown websocket message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing websocket message:', error);
          }
        };

        ws.onclose = () => {
          useAnalyticsStore.getState().setWebsocketStatus(false);
          // Reconnect after 5 seconds
          reconnectTimer = setTimeout(connect, 5000);
        };

        ws.onerror = (error) => {
          console.error('Websocket error:', error);
        };

      } catch (error) {
        console.error('Failed to establish websocket connection:', error);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isRealTimeEnabled]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await refreshData();
        setLastRefresh(new Date());
      } catch (error) {
        setError('Failed to load dashboard data');
      }
    };

    loadInitialData();
  }, [refreshData, setError]);

  // Handle drag end for widget reordering
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = dashboardConfig.widgets.findIndex(w => w.id === active.id);
      const newIndex = dashboardConfig.widgets.findIndex(w => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = arrayMove(dashboardConfig.widgets, oldIndex, newIndex);
        updateDashboardConfig({ widgets: newWidgets });
      }
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      await exportData(format);
    } catch (error) {
      setError(`Export failed: ${error}`);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshData();
      setLastRefresh(new Date());
    } catch (error) {
      setError('Failed to refresh dashboard data');
    }
  };

  const getWidgetComponent = (widgetType: string) => {
    switch (widgetType) {
      case 'sales':
        return <SalesForecastingModule key="sales-forecast" className="h-full" />;
      case 'customer':
        return <CustomerBehaviorAnalytics key="customer-analytics" className="h-full" />;
      case 'financial':
        return <FinancialHealthIndicators key="financial-health" className="h-full" />;
      default:
        return <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">Unknown widget type</div>;
    }
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-red-800">
          <h3 className="text-lg font-semibold mb-2">Dashboard Error</h3>
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Predictive Analytics Dashboard</h1>
              <div className="ml-6 flex items-center space-x-4">
                {/* Real-time status */}
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  websocketConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${
                    websocketConnected ? 'bg-green-400' : 'bg-gray-400'
                  }`}></span>
                  {isRealTimeEnabled ? (websocketConnected ? 'Live' : 'Connecting...') : 'Static'}
                </div>
                
                {/* Last refresh time */}
                {lastRefresh && (
                  <span className="text-sm text-gray-500">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Real-time toggle */}
              <button
                onClick={toggleRealTime}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isRealTimeEnabled ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Real-time
              </button>

              {/* Filter button */}
              <button
                onClick={() => setIsFilterPanelOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
              </button>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>

              {/* Export dropdown */}
              <ExportButton onExport={handleExport} disabled={isLoading} />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={dashboardConfig.widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {dashboardConfig.widgets
                .filter(widget => widget.visible)
                .map((widget) => (
                  <SortableItem key={widget.id} id={widget.id}>
                    {getWidgetComponent(widget.type)}
                  </SortableItem>
                ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-700">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
