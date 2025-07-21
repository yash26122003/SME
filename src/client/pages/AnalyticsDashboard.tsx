/**
 * Advanced Analytics Dashboard
 * Main dashboard component for SME predictive analytics with comprehensive features
 */

import React, { useEffect, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useDashboardStore } from '@client/store/dashboardStore';
import { DashboardWidget } from '@shared/types/analytics';
import SalesForecastingWidget from '@client/components/dashboard/SalesForecastingWidget';
import CustomerAnalyticsWidget from '@client/components/dashboard/CustomerAnalyticsWidget';
import CashFlowWidget from '@client/components/dashboard/CashFlowWidget';
import ProfitabilityWidget from '@client/components/dashboard/ProfitabilityWidget';
import KPICard from '@client/components/dashboard/KPICard';
import DashboardHeader from '@client/components/dashboard/DashboardHeader';
import WidgetControls from '@client/components/dashboard/WidgetControls';
import AlertsPanel from '@client/components/dashboard/AlertsPanel';
import InsightsPanel from '@client/components/dashboard/InsightsPanel';
import ExportDialog from '@client/components/dashboard/ExportDialog';
import LoadingSpinner from '@client/components/ui/LoadingSpinner';
import ErrorBoundary from '@client/components/ui/ErrorBoundary';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const AnalyticsDashboard: React.FC = () => {
  const {
    currentDashboard,
    widgets,
    loading,
    error,
    kpis,
    alerts,
    insights,
    isRealTimeEnabled,
    fetchDashboardData,
    enableRealTime,
    disableRealTime,
    updateWidget,
    reorderWidgets,
    selectedDateRange,
    filters
  } = useDashboardStore();

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [dashboardId] = useState('default-dashboard'); // In production, this would come from routing

  // Initialize dashboard data
  useEffect(() => {
    fetchDashboardData(dashboardId);
  }, [dashboardId, fetchDashboardData]);

  // Handle layout changes
  const handleLayoutChange = (layout: any) => {
    if (currentDashboard?.widgets) {
      const updatedWidgets = currentDashboard.widgets.map(widget => {
        const layoutItem = layout.find((item: any) => item.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h
            }
          };
        }
        return widget;
      });
      reorderWidgets(updatedWidgets);
    }
  };

  // Render widget based on type
  const renderWidget = (widget: DashboardWidget) => {
    const baseProps = {
      widget,
      onUpdate: (updates: Partial<DashboardWidget>) => updateWidget(widget.id, updates),
      dateRange: selectedDateRange,
      filters
    };

    switch (widget.type) {
      case 'SALES_FORECAST':
        return <SalesForecastingWidget {...baseProps} />;
      case 'CUSTOMER_CLV':
      case 'CHURN_PREDICTION':
        return <CustomerAnalyticsWidget {...baseProps} />;
      case 'CASH_FLOW':
        return <CashFlowWidget {...baseProps} />;
      case 'PROFITABILITY':
        return <ProfitabilityWidget {...baseProps} />;
      case 'KPI_CARD':
        return <KPICard {...baseProps} />;
      default:
        return (
          <div className="p-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Widget type not supported: {widget.type}</p>
          </div>
        );
    }
  };

  // Prepare layout for react-grid-layout
  const layout = currentDashboard?.widgets.map(widget => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: 2,
    minH: 2
  })) || [];

  const breakpoints = {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0
  };

  const cols = {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h3 className="font-bold">Error loading dashboard</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={() => fetchDashboardData(dashboardId)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Dashboard Header */}
        <DashboardHeader
          dashboard={currentDashboard}
          kpis={kpis}
          isRealTimeEnabled={isRealTimeEnabled}
          onToggleRealTime={isRealTimeEnabled ? disableRealTime : enableRealTime}
          onExport={() => setIsExportDialogOpen(true)}
          selectedWidgets={selectedWidgets}
          onWidgetSelectionChange={setSelectedWidgets}
        />

        <div className="flex">
          {/* Main Dashboard Content */}
          <div className="flex-1 p-6">
            {/* Widget Controls */}
            <div className="mb-6">
              <WidgetControls
                onAddWidget={(widget) => updateWidget(widget.id, widget)}
                availableWidgetTypes={[
                  'SALES_FORECAST',
                  'CUSTOMER_CLV',
                  'CHURN_PREDICTION',
                  'CASH_FLOW',
                  'PROFITABILITY',
                  'KPI_CARD',
                  'TREND_CHART',
                  'PIE_CHART',
                  'BAR_CHART'
                ]}
              />
            </div>

            {/* Responsive Grid Layout */}
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: layout }}
              breakpoints={breakpoints}
              cols={cols}
              rowHeight={60}
              onLayoutChange={handleLayoutChange}
              isDraggable={true}
              isResizable={true}
              margin={[16, 16]}
              containerPadding={[0, 0]}
              useCSSTransforms={true}
            >
              {currentDashboard?.widgets.map(widget => (
                <div key={widget.id} className="widget-container">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden">
                    {/* Widget Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">{widget.title}</h3>
                      <div className="flex items-center space-x-2">
                        {widget.loading && <LoadingSpinner size="sm" />}
                        <button
                          onClick={() => {
                            if (selectedWidgets.includes(widget.id)) {
                              setSelectedWidgets(prev => prev.filter(id => id !== widget.id));
                            } else {
                              setSelectedWidgets(prev => [...prev, widget.id]);
                            }
                          }}
                          className={`p-1 rounded ${
                            selectedWidgets.includes(widget.id)
                              ? 'bg-blue-100 text-blue-600'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Widget Content */}
                    <div className="p-4 h-full overflow-auto">
                      {widget.error ? (
                        <div className="text-center text-red-600 p-8">
                          <p className="text-sm">Error loading widget</p>
                          <p className="text-xs text-gray-500 mt-1">{widget.error}</p>
                        </div>
                      ) : (
                        renderWidget(widget)
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>

          {/* Side Panels */}
          <div className="w-80 bg-white border-l border-gray-200">
            {/* Alerts Panel */}
            {alerts.length > 0 && (
              <div className="border-b border-gray-200">
                <AlertsPanel alerts={alerts} />
              </div>
            )}

            {/* Insights Panel */}
            <InsightsPanel insights={insights} />
          </div>
        </div>

        {/* Export Dialog */}
        {isExportDialogOpen && (
          <ExportDialog
            isOpen={isExportDialogOpen}
            onClose={() => setIsExportDialogOpen(false)}
            widgets={selectedWidgets.length > 0 
              ? currentDashboard?.widgets.filter(w => selectedWidgets.includes(w.id)) || []
              : currentDashboard?.widgets || []
            }
            dateRange={selectedDateRange}
          />
        )}

        {/* Toast Notifications */}
        <div className="fixed bottom-4 right-4 z-50">
          {/* Real-time update notifications would go here */}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AnalyticsDashboard;
