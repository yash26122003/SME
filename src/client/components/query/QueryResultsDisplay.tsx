/**
 * Query Results Display Component
 * Displays the results of processed natural language queries
 */

import React from 'react';
import { NLQuery } from '@shared/types/query';

interface QueryResultsDisplayProps {
  query: NLQuery;
  onFeedbackSubmit?: (feedback: { helpful: boolean; accurate: boolean; comment?: string }) => void;
}

export const QueryResultsDisplay: React.FC<QueryResultsDisplayProps> = ({
  query,
  onFeedbackSubmit
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Query Results
        </h3>
        <p className="text-gray-600">
          Query: "{query.rawQuery}"
        </p>
      </div>

      {/* Query Status */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          query.status === 'COMPLETED' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {query.status}
        </span>
        {query.confidence && (
          <span className="ml-2 text-sm text-gray-500">
            Confidence: {Math.round(query.confidence * 100)}%
          </span>
        )}
      </div>

      {/* Processed Query Info */}
      {query.processedQuery && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Query Analysis</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Intent:</strong> {query.processedQuery.intent}</p>
            <p><strong>Explanation:</strong> {query.processedQuery.explanation}</p>
            {query.processedQuery.sqlQuery && (
              <div>
                <strong>Generated SQL:</strong>
                <pre className="mt-1 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">
                  {query.processedQuery.sqlQuery}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {query.results && query.results.length > 0 ? (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Results</h4>
          {query.results.map((result, index) => (
            <div key={result.id || index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">{result.summary}</p>
              <div className="text-sm text-gray-500">
                <span>Visualization: {result.visualizationType}</span>
                <span className="ml-4">Rows: {result.metadata.totalRows}</span>
              </div>
              
              {/* Simple data preview */}
              {result.data && result.data.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-2">Data Preview:</div>
                  <div className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    <pre>{JSON.stringify(result.data.slice(0, 3), null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Insights */}
              {result.insights && result.insights.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-gray-700 mb-2">Key Insights:</div>
                  {result.insights.map((insight, idx) => (
                    <div key={idx} className="bg-blue-50 p-2 rounded mb-2">
                      <div className="text-xs font-medium text-blue-800">{insight.title}</div>
                      <div className="text-xs text-blue-600">{insight.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No results to display</p>
        </div>
      )}

      {/* Feedback Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Was this helpful?</span>
          <div className="flex space-x-2">
            <button
              onClick={() => onFeedbackSubmit?.({ helpful: true, accurate: true })}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              👍 Yes
            </button>
            <button
              onClick={() => onFeedbackSubmit?.({ helpful: false, accurate: false })}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              👎 No
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
