/**
 * Main App Component - With Query Interface
 * Root component for the AI-powered Business Intelligence Platform
 */

import React, { useState } from 'react';
import ErrorBoundary from './components/ui/ErrorBoundary';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/queries/demo', { // Use demo endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setResults(data.data.query);
      } else {
        setError(data.error || 'Failed to process query');
      }
    } catch (err) {
      setError('Network error: Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Business AI Platform
          </h1>
          
          {/* Welcome Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Ask Your Business Data Anything
            </h2>
            <p className="text-gray-600 mb-4">
              Get instant insights from your business data using natural language.
            </p>
          </div>

          {/* Query Input Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your question:
                </label>
                <div className="flex space-x-2">
                  <input
                    id="query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Show me this month's revenue trends"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Processing...' : 'Ask'}
                  </button>
                </div>
              </div>
              
              {/* Sample queries */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500">Try:</span>
                {[
                  'Show sales trends',
                  'Top performing products', 
                  'Customer growth rate',
                  'Revenue by region'
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setQuery(sample)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-700">Processing your query...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-700 font-medium">Error:</span>
                <span className="text-red-600">{error}</span>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{results.analysis?.title || 'Analysis Results'}</h3>
                <p className="text-gray-600 mt-2">{results.analysis?.summary}</p>
                <div className="mt-2 text-sm text-gray-500">
                  Processed in {results.processingTime}ms • {results.timestamp && new Date(results.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Key Insights */}
              {results.analysis?.insights && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">📊 Key Insights</h4>
                  <div className="grid gap-3">
                    {results.analysis.insights.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                        </div>
                        <p className="text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Table */}
              {results.analysis?.data && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">📈 Data Overview</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(results.analysis.data[0] || {}).map((key) => (
                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.analysis.data.slice(0, 6).map((row: any, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.entries(row).map(([key, value]: [string, any]) => (
                              <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof value === 'number' && key.includes('revenue') || key.includes('value') ? 
                                  `$${value.toLocaleString()}` : 
                                  typeof value === 'number' && (key.includes('growth') || key.includes('change')) ? 
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    value > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {value > 0 ? '↗' : '↘'} {Math.abs(value)}%
                                  </span> :
                                  typeof value === 'number' ? value.toLocaleString() : value
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Chart Type Indicator */}
              {results.analysis?.chartType && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">📊 Recommended visualization:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {results.analysis.chartType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
