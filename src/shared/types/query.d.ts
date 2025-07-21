/**
 * Types for Natural Language Query Processing
 * Extends the core types for AI-powered query interface
 */
import { BusinessMetric, IndustryType } from './index';
export interface NLQuery {
    id: string;
    tenantId: string;
    userId: string;
    rawQuery: string;
    processedQuery?: ProcessedQuery;
    results?: QueryResult[];
    status: QueryStatus;
    confidence: number;
    processingTime: number;
    tokensUsed?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProcessedQuery {
    intent: QueryIntent;
    entities: QueryEntity[];
    timeframe: QueryTimeframe;
    metrics: string[];
    filters: QueryFilter[];
    groupBy: string[];
    orderBy: QueryOrder[];
    sqlQuery: string;
    explanation: string;
    suggestions: string[];
}
export interface QueryEntity {
    type: EntityType;
    value: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
}
export interface QueryTimeframe {
    type: TimeframeType;
    start?: Date;
    end?: Date;
    period?: TimePeriod;
    relative?: RelativeTimeframe;
}
export interface QueryResult {
    id: string;
    data: any[];
    summary: string;
    visualizationType: VisualizationType;
    chartConfig?: ChartConfiguration;
    insights: QueryInsight[];
    metadata: QueryMetadata;
}
export interface QueryInsight {
    type: InsightType;
    title: string;
    description: string;
    confidence: number;
    significance: InsightSignificance;
    recommendations: string[];
}
export interface QueryMetadata {
    totalRows: number;
    columns: ColumnMetadata[];
    executionTime: number;
    dataFreshness: Date;
    hasMore: boolean;
}
export interface ColumnMetadata {
    name: string;
    type: ColumnType;
    format?: string;
    unit?: string;
    description?: string;
}
export interface QueryContext {
    tenantId: string;
    userId: string;
    industry: IndustryType;
    availableMetrics: BusinessMetric[];
    previousQueries: NLQuery[];
    userPreferences: QueryPreferences;
    sessionContext: SessionContext;
}
export interface QueryPreferences {
    defaultTimeframe: TimeframeType;
    preferredVisualization: VisualizationType;
    detailLevel: DetailLevel;
    includeInsights: boolean;
    includeRecommendations: boolean;
    language: string;
}
export interface SessionContext {
    conversationId: string;
    previousQueries: string[];
    contextVariables: Record<string, any>;
    clarificationHistory: ClarificationRequest[];
}
export interface ClarificationRequest {
    id: string;
    question: string;
    options: ClarificationOption[];
    response?: string;
    timestamp: Date;
}
export interface ClarificationOption {
    value: string;
    label: string;
    description?: string;
}
export interface AIQueryProcessor {
    parseIntent(query: string, context: QueryContext): Promise<QueryIntent>;
    extractEntities(query: string, context: QueryContext): Promise<QueryEntity[]>;
    generateSQL(query: ProcessedQuery, context: QueryContext): Promise<string>;
    validateQuery(sqlQuery: string, context: QueryContext): Promise<ValidationResult>;
    explainQuery(query: ProcessedQuery): Promise<string>;
    generateSuggestions(query: string, context: QueryContext): Promise<string[]>;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    estimatedCost: QueryCost;
}
export interface ValidationError {
    type: ErrorType;
    message: string;
    suggestion?: string;
    field?: string;
}
export interface ValidationWarning {
    type: WarningType;
    message: string;
    suggestion?: string;
}
export interface QueryCost {
    estimatedRows: number;
    estimatedTime: number;
    complexity: QueryComplexity;
    resourceUsage: ResourceUsage;
}
export interface ResourceUsage {
    cpuUnits: number;
    memoryMB: number;
    ioOperations: number;
}
export interface VoiceQuery {
    id: string;
    audioBlob?: Blob;
    transcript: string;
    confidence: number;
    language: string;
    processingTime: number;
    status: VoiceStatus;
    createdAt: Date;
}
export interface SpeechRecognitionConfig {
    language: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    grammars?: SpeechGrammar[];
}
export interface QuerySuggestion {
    id: string;
    text: string;
    category: SuggestionCategory;
    popularity: number;
    relevance: number;
    industry?: IndustryType;
    examples: string[];
    description?: string;
}
export interface AutoCompleteResult {
    suggestions: QuerySuggestion[];
    completions: string[];
    entities: QueryEntity[];
    confidence: number;
    processingTime: number;
}
export interface QueryTemplate {
    id: string;
    name: string;
    template: string;
    category: SuggestionCategory;
    industry?: IndustryType;
    variables: TemplateVariable[];
    examples: string[];
    description: string;
}
export interface TemplateVariable {
    name: string;
    type: VariableType;
    required: boolean;
    defaultValue?: any;
    options?: VariableOption[];
    description?: string;
}
export interface VariableOption {
    value: any;
    label: string;
    description?: string;
}
export interface QueryHistory {
    userId: string;
    tenantId: string;
    queries: HistoryEntry[];
    totalQueries: number;
    favoriteQueries: string[];
    recentSearches: string[];
    queryFrequency: QueryFrequencyData[];
}
export interface HistoryEntry {
    queryId: string;
    query: string;
    timestamp: Date;
    executionTime: number;
    resultCount: number;
    isFavorite: boolean;
    tags: string[];
}
export interface QueryFrequencyData {
    query: string;
    count: number;
    lastUsed: Date;
    avgExecutionTime: number;
}
export interface ChartConfiguration {
    type: VisualizationType;
    xAxis: AxisConfiguration;
    yAxis: AxisConfiguration;
    series: SeriesConfiguration[];
    styling: ChartStyling;
    interactive: boolean;
    annotations?: ChartAnnotation[];
}
export interface AxisConfiguration {
    field: string;
    label: string;
    type: AxisType;
    format?: string;
    scale?: ScaleType;
    min?: number;
    max?: number;
}
export interface SeriesConfiguration {
    field: string;
    name: string;
    type: SeriesType;
    color?: string;
    aggregation?: AggregationType;
}
export interface ChartStyling {
    theme: ChartTheme;
    colors: string[];
    showLegend: boolean;
    showGrid: boolean;
    showTooltip: boolean;
    responsive: boolean;
}
export interface ChartAnnotation {
    type: AnnotationType;
    value: any;
    label: string;
    color?: string;
    style?: AnnotationStyle;
}
export declare enum QueryStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    ERROR = "error",
    CANCELLED = "cancelled",
    REQUIRES_CLARIFICATION = "requires_clarification"
}
export declare enum QueryIntent {
    TREND_ANALYSIS = "trend_analysis",
    COMPARISON = "comparison",
    AGGREGATION = "aggregation",
    FILTERING = "filtering",
    RANKING = "ranking",
    FORECASTING = "forecasting",
    ANOMALY_DETECTION = "anomaly_detection",
    DRILL_DOWN = "drill_down",
    SUMMARY = "summary",
    CORRELATION = "correlation"
}
export declare enum EntityType {
    METRIC = "metric",
    DIMENSION = "dimension",
    TIME_PERIOD = "time_period",
    COMPARISON_OPERATOR = "comparison_operator",
    AGGREGATION_FUNCTION = "aggregation_function",
    FILTER_VALUE = "filter_value",
    BUSINESS_ENTITY = "business_entity"
}
export declare enum TimeframeType {
    ABSOLUTE = "absolute",
    RELATIVE = "relative",
    ROLLING = "rolling",
    COMPARISON = "comparison"
}
export declare enum RelativeTimeframe {
    TODAY = "today",
    YESTERDAY = "yesterday",
    THIS_WEEK = "this_week",
    LAST_WEEK = "last_week",
    THIS_MONTH = "this_month",
    LAST_MONTH = "last_month",
    THIS_QUARTER = "this_quarter",
    LAST_QUARTER = "last_quarter",
    THIS_YEAR = "this_year",
    LAST_YEAR = "last_year",
    LAST_7_DAYS = "last_7_days",
    LAST_30_DAYS = "last_30_days",
    LAST_90_DAYS = "last_90_days",
    LAST_12_MONTHS = "last_12_months"
}
export declare enum TimePeriod {
    HOUR = "hour",
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    QUARTER = "quarter",
    YEAR = "year"
}
export declare enum VisualizationType {
    TABLE = "table",
    LINE_CHART = "line_chart",
    BAR_CHART = "bar_chart",
    PIE_CHART = "pie_chart",
    AREA_CHART = "area_chart",
    SCATTER_PLOT = "scatter_plot",
    HEATMAP = "heatmap",
    GAUGE = "gauge",
    KPI_CARD = "kpi_card",
    FUNNEL = "funnel",
    TREEMAP = "treemap"
}
export declare enum ColumnType {
    STRING = "string",
    NUMBER = "number",
    INTEGER = "integer",
    DECIMAL = "decimal",
    BOOLEAN = "boolean",
    DATE = "date",
    DATETIME = "datetime",
    CURRENCY = "currency",
    PERCENTAGE = "percentage"
}
export declare enum DetailLevel {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare enum InsightType {
    TREND = "trend",
    ANOMALY = "anomaly",
    CORRELATION = "correlation",
    SEASONAL_PATTERN = "seasonal_pattern",
    THRESHOLD_ALERT = "threshold_alert",
    COMPARATIVE_ANALYSIS = "comparative_analysis"
}
export declare enum InsightSignificance {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare enum VoiceStatus {
    IDLE = "idle",
    LISTENING = "listening",
    PROCESSING = "processing",
    COMPLETED = "completed",
    ERROR = "error"
}
export declare enum SuggestionCategory {
    POPULAR = "popular",
    RECENT = "recent",
    RECOMMENDED = "recommended",
    TEMPLATE = "template",
    SIMILAR = "similar"
}
export declare enum VariableType {
    STRING = "string",
    NUMBER = "number",
    DATE = "date",
    ENUM = "enum",
    BOOLEAN = "boolean"
}
export declare enum ErrorType {
    SYNTAX_ERROR = "syntax_error",
    INVALID_METRIC = "invalid_metric",
    INVALID_TIMEFRAME = "invalid_timeframe",
    PERMISSION_DENIED = "permission_denied",
    RESOURCE_LIMIT = "resource_limit",
    DATA_NOT_FOUND = "data_not_found"
}
export declare enum WarningType {
    PERFORMANCE = "performance",
    DATA_QUALITY = "data_quality",
    APPROXIMATION = "approximation",
    DEPRECATED = "deprecated"
}
export declare enum QueryComplexity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export declare enum AxisType {
    CATEGORY = "category",
    VALUE = "value",
    TIME = "time",
    LOG = "log"
}
export declare enum ScaleType {
    LINEAR = "linear",
    LOG = "log",
    TIME = "time"
}
export declare enum SeriesType {
    LINE = "line",
    BAR = "bar",
    AREA = "area",
    SCATTER = "scatter"
}
export declare enum AggregationType {
    SUM = "sum",
    AVG = "avg",
    COUNT = "count",
    MIN = "min",
    MAX = "max",
    MEDIAN = "median"
}
export declare enum ChartTheme {
    LIGHT = "light",
    DARK = "dark",
    COLORFUL = "colorful",
    MINIMAL = "minimal"
}
export declare enum AnnotationType {
    LINE = "line",
    AREA = "area",
    POINT = "point",
    TEXT = "text"
}
export declare enum AnnotationStyle {
    SOLID = "solid",
    DASHED = "dashed",
    DOTTED = "dotted"
}
export interface QueryFilter {
    field: string;
    operator: FilterOperator;
    value: any;
    type: FilterType;
}
export interface QueryOrder {
    field: string;
    direction: 'asc' | 'desc';
}
export declare enum FilterOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    GREATER_THAN = "greater_than",
    GREATER_THAN_EQUAL = "greater_than_equal",
    LESS_THAN = "less_than",
    LESS_THAN_EQUAL = "less_than_equal",
    CONTAINS = "contains",
    NOT_CONTAINS = "not_contains",
    IN = "in",
    NOT_IN = "not_in",
    BETWEEN = "between",
    IS_NULL = "is_null",
    IS_NOT_NULL = "is_not_null"
}
export declare enum FilterType {
    TEXT = "text",
    NUMBER = "number",
    DATE = "date",
    BOOLEAN = "boolean",
    ENUM = "enum"
}
//# sourceMappingURL=query.d.ts.map