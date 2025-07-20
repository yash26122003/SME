/**
 * Natural Language Query Interface Component
 * Sophisticated search component with AI-powered suggestions, voice input, and real-time feedback
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MagnifyingGlassIcon, 
  MicrophoneIcon, 
  SparklesIcon,
  ClockIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  MicrophoneIcon as MicrophoneIconSolid,
  HeartIcon as HeartIconSolid 
} from '@heroicons/react/24/solid';
import {
  NLQuery,
  QueryStatus,
  VoiceStatus,
  AutoCompleteResult,
  QuerySuggestion,
  SuggestionCategory
} from '@shared/types/query';
import { APIResponse } from '@shared/types';
import { useDebounce } from '@client/hooks/useDebounce';
import { useVoiceInput } from '@client/hooks/useVoiceInput';
import { useQueryHistory } from '@client/hooks/useQueryHistory';
import { QueryResultsDisplay } from './QueryResultsDisplay';
import { QueryHistoryPanel } from './QueryHistoryPanel';
import LoadingSpinner from '@components/ui/LoadingSpinner';
import ErrorBoundary from '@components/ui/ErrorBoundary';

interface NaturalLanguageQueryProps {
  onQuerySubmit?: (query: string) => void;
  onResultsReceived?: (results: NLQuery) => void;
  className?: string;
  placeholder?: string;
  showHistory?: boolean;
  showVoiceInput?: boolean;
}

export const NaturalLanguageQuery: React.FC<NaturalLanguageQueryProps> = ({
  onQuerySubmit,
  onResultsReceived,
  className = '',
  placeholder = 'Ask me anything about your business data...',
  showHistory = true,
  showVoiceInput = true
}) => {
  // State management
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AutoCompleteResult | null>(null);
  const [currentResults, setCurrentResults] = useState<NLQuery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const debouncedQuery = useDebounce(query, 300);
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    isSupported: voiceSupported 
  } = useVoiceInput();
  const { history, addToHistory, toggleFavorite } = useQueryHistory();

  // Update query when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions(null);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch query suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    try {
      const response = await fetch(
        `/api/queries/suggestions?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result: APIResponse<AutoCompleteResult> = await response.json();
      
      if (result.success && result.data) {
        setSuggestions(result.data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, []);

  // Process natural language query
  const processQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsProcessing(true);
    setError(null);
    onQuerySubmit?.(queryText);

    try {
      const response = await fetch('/api/queries/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: queryText,
          context: {
            conversationId: `session_${Date.now()}`,
            includeInsights: true,
            includeRecommendations: true
          }
        })
      });

      const result: APIResponse<{ query: NLQuery }> = await response.json();
      
      if (result.success && result.data) {
        setCurrentResults(result.data.query);
        addToHistory(result.data.query);
        onResultsReceived?.(result.data.query);
        setShowSuggestions(false);
      } else {
        setError(result.error || 'Failed to process query');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [onQuerySubmit, onResultsReceived, addToHistory]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processQuery(query);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: QuerySuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    processQuery(suggestion.text);
  };

  // Handle voice input toggle
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions && suggestions.suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Render status indicator
  const renderStatusIndicator = () => {
    if (isProcessing) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <LoadingSpinner size="sm" />
          <span className="text-sm">Processing your query...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      );
    }

    if (currentResults?.status === QueryStatus.COMPLETED) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircleIcon className="h-5 w-5" />
          <span className="text-sm">
            Query completed in {currentResults.processingTime}ms
          </span>
        </div>
      );
    }

    return null;
  };

  // Render suggestion category icon
  const renderCategoryIcon = (category: SuggestionCategory) => {
    switch (category) {
      case SuggestionCategory.POPULAR:
        return <SparklesIcon className="h-4 w-4 text-yellow-500" />;
      case SuggestionCategory.RECENT:
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case SuggestionCategory.RECOMMENDED:
        return <SparklesIcon className="h-4 w-4 text-green-500" />;
      default:
        return <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <ErrorBoundary>
      <div className={`relative w-full ${className}`}>
        {/* Query Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            {/* Search Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={isProcessing}
              className={`
                block w-full pl-10 pr-20 py-4 text-lg
                border border-gray-300 rounded-xl shadow-sm
                placeholder-gray-500 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:bg-gray-50 disabled:cursor-not-allowed
                transition-all duration-200
                ${isProcessing ? 'opacity-50' : ''}
              `}
            />

            {/* Voice Input & Submit Buttons */}
            <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
              {/* Voice Input Button */}
              {showVoiceInput && voiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  disabled={isProcessing}
                  className={`
                    p-2 rounded-lg transition-colors duration-200
                    ${isListening 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? (
                    <MicrophoneIconSolid className="h-5 w-5 animate-pulse" />
                  ) : (
                    <MicrophoneIcon className="h-5 w-5" />
                  )}
                </button>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!query.trim() || isProcessing}
                className="
                  px-4 py-2 bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
              >
                {isProcessing ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  'Ask'
                )}
              </button>
            </div>
          </div>

          {/* Voice Status Indicator */}
          {isListening && (
            <div className="absolute top-full left-0 right-0 mt-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <MicrophoneIconSolid className="h-5 w-5 text-red-600 animate-pulse" />
                  <span className="text-red-700 font-medium">Listening...</span>
                  <span className="text-red-600 text-sm">Speak your question</span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Status Indicator */}
        <div className="mt-3">
          {renderStatusIndicator()}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions && suggestions.suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto"
          >
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Suggestions
              </div>
              {suggestions.suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id || index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="
                    w-full px-4 py-3 text-left hover:bg-gray-50 
                    flex items-center space-x-3 group
                    focus:outline-none focus:bg-gray-50
                  "
                >
                  {renderCategoryIcon(suggestion.category)}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-blue-600">
                      {suggestion.text}
                    </div>
                    {suggestion.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(suggestion.relevance * 100)}% match
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="mt-4 flex items-center space-x-4">
          {showHistory && (
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className="
                flex items-center space-x-2 px-3 py-2 
                text-gray-600 hover:text-blue-600 
                bg-gray-100 hover:bg-blue-50 
                rounded-lg transition-colors duration-200
              "
            >
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm font-medium">History</span>
            </button>
          )}
          
          <div className="text-sm text-gray-500">
            Try: "Show sales trends", "Top performing products", or "Customer growth rate"
          </div>
        </div>

        {/* Query Results */}
        {currentResults && (
          <div className="mt-6">
            <QueryResultsDisplay 
              query={currentResults}
              onFeedbackSubmit={(feedback) => {
                // Handle feedback submission
                console.log('Feedback submitted:', feedback);
              }}
            />
          </div>
        )}

        {/* History Panel */}
        {showHistoryPanel && (
          <QueryHistoryPanel
            isOpen={showHistoryPanel}
            onClose={() => setShowHistoryPanel(false)}
            onQuerySelect={(query) => {
              setQuery(query.rawQuery);
              setShowHistoryPanel(false);
              processQuery(query.rawQuery);
            }}
            history={history}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default NaturalLanguageQuery;
