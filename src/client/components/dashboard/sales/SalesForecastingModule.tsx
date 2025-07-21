import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { useAnalyticsStore, SalesForecast } from '../../../stores/analyticsStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesForecastingModuleProps {
  className?: string;
}

const SalesForecastingModule: React.FC<SalesForecastingModuleProps> = ({ className = '' }) => {
  const {
    salesForecasts,
    isLoading,
    error,
    filters,
    dashboardConfig,
  } = useAnalyticsStore();

  const [selectedModel, setSelectedModel] = useState<'arima' | 'prophet'>('prophet');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [zoomLevel, setZoomLevel] = useState<{ start: number; end: number }>({ start: 0, end: 100 });

  // Format currency based on dashboard config
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: dashboardConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate accuracy metrics
  const accuracyMetrics = useMemo(() => {
    if (!salesForecasts.length) return null;

    const actualData = salesForecasts.filter(f => f.actual !== undefined);
    if (actualData.length === 0) return null;

    const mape = actualData.reduce((acc, forecast) => {
      const actual = forecast.actual!;
      const predicted = forecast.predicted;
      return acc + Math.abs((actual - predicted) / actual);
    }, 0) / actualData.length * 100;

    const rmse = Math.sqrt(
      actualData.reduce((acc, forecast) => {
        const actual = forecast.actual!;
        const predicted = forecast.predicted;
        return acc + Math.pow(actual - predicted, 2);
      }, 0) / actualData.length
    );

    return { mape, rmse };
  }, [salesForecasts]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!salesForecasts.length) return null;

    const startIndex = Math.floor((zoomLevel.start / 100) * salesForecasts.length);
    const endIndex = Math.floor((zoomLevel.end / 100) * salesForecasts.length);
    const visibleData = salesForecasts.slice(startIndex, endIndex);

    return {
      labels: visibleData.map(f => format(parseISO(f.date), 'MMM yyyy')),
      datasets: [
        {
          label: 'Actual Sales',
          data: visibleData.map(f => f.actual || null),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Predicted Sales',
          data: visibleData.map(f => f.predicted),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.1,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderDash: [5, 5],
        },
        {
          label: `${confidenceLevel}% Confidence Upper`,
          data: visibleData.map(f => f.confidence_upper),
          borderColor: 'rgba(239, 68, 68, 0.3)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: '+1',
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          label: `${confidenceLevel}% Confidence Lower`,
          data: visibleData.map(f => f.confidence_lower),
          borderColor: 'rgba(239, 68, 68, 0.3)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    };
  }, [salesForecasts, zoomLevel, confidenceLevel]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `Sales Forecasting - ${selectedModel.toUpperCase()} Model`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: `Sales (${dashboardConfig.currency})`,
        },
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  // Calculate seasonal trends
  const seasonalAnalysis = useMemo(() => {
    if (!salesForecasts.length) return null;

    const trends = {
      up: salesForecasts.filter(f => f.seasonal_trend === 'up').length,
      down: salesForecasts.filter(f => f.seasonal_trend === 'down').length,
      stable: salesForecasts.filter(f => f.seasonal_trend === 'stable').length,
    };

    const total = trends.up + trends.down + trends.stable;
    return {
      ...trends,
      dominant: total > 0 ? 
        Object.entries(trends).reduce((a, b) => trends[a[0] as keyof typeof trends] > trends[b[0] as keyof typeof trends] ? a : b)[0] :
        'stable'
    };
  }, [salesForecasts]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-red-600 text-center">
          <p>Error loading sales forecast data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sales Forecasting</h3>
        
        <div className="flex flex-wrap gap-4">
          {/* Model Selection */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as 'arima' | 'prophet')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="prophet">Prophet Model</option>
            <option value="arima">ARIMA Model</option>
          </select>

          {/* Period Selection */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          {/* Confidence Level */}
          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={80}>80% Confidence</option>
            <option value={90}>90% Confidence</option>
            <option value={95}>95% Confidence</option>
            <option value={99}>99% Confidence</option>
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {accuracyMetrics && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-600">Model Accuracy (MAPE)</div>
              <div className="text-2xl font-bold text-blue-900">
                {accuracyMetrics.mape.toFixed(1)}%
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-600">RMSE</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(accuracyMetrics.rmse)}
              </div>
            </div>
          </>
        )}
        {seasonalAnalysis && (
          <>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-600">Dominant Trend</div>
              <div className="text-2xl font-bold text-purple-900 capitalize">
                {seasonalAnalysis.dominant}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-orange-600">Forecast Periods</div>
              <div className="text-2xl font-bold text-orange-900">
                {salesForecasts.length}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="h-96 mb-6">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No forecast data available
          </div>
        )}
      </div>

      {/* Zoom Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Range Zoom
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="0"
            max="80"
            value={zoomLevel.start}
            onChange={(e) => setZoomLevel(prev => ({ ...prev, start: Number(e.target.value) }))}
            className="flex-1"
          />
          <span className="text-sm text-gray-500">to</span>
          <input
            type="range"
            min="20"
            max="100"
            value={zoomLevel.end}
            onChange={(e) => setZoomLevel(prev => ({ ...prev, end: Number(e.target.value) }))}
            className="flex-1"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{zoomLevel.start}%</span>
          <span>{zoomLevel.end}%</span>
        </div>
      </div>

      {/* Insights */}
      {salesForecasts.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {selectedModel.toUpperCase()} model shows {accuracyMetrics ? `${accuracyMetrics.mape.toFixed(1)}% MAPE` : 'good'} accuracy</li>
            {seasonalAnalysis && (
              <li>• Seasonal trend is predominantly {seasonalAnalysis.dominant}</li>
            )}
            <li>• Forecast extends {salesForecasts.length} periods into the future</li>
            <li>• Confidence intervals provide risk assessment for planning</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SalesForecastingModule;
