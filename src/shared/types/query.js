"use strict";
/**
 * Types for Natural Language Query Processing
 * Extends the core types for AI-powered query interface
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterType = exports.FilterOperator = exports.AnnotationStyle = exports.AnnotationType = exports.ChartTheme = exports.AggregationType = exports.SeriesType = exports.ScaleType = exports.AxisType = exports.QueryComplexity = exports.WarningType = exports.ErrorType = exports.VariableType = exports.SuggestionCategory = exports.VoiceStatus = exports.InsightSignificance = exports.InsightType = exports.DetailLevel = exports.ColumnType = exports.VisualizationType = exports.TimePeriod = exports.RelativeTimeframe = exports.TimeframeType = exports.EntityType = exports.QueryIntent = exports.QueryStatus = void 0;
// ==================== Enums ====================
var QueryStatus;
(function (QueryStatus) {
    QueryStatus["PENDING"] = "pending";
    QueryStatus["PROCESSING"] = "processing";
    QueryStatus["COMPLETED"] = "completed";
    QueryStatus["ERROR"] = "error";
    QueryStatus["CANCELLED"] = "cancelled";
    QueryStatus["REQUIRES_CLARIFICATION"] = "requires_clarification";
})(QueryStatus || (exports.QueryStatus = QueryStatus = {}));
var QueryIntent;
(function (QueryIntent) {
    QueryIntent["TREND_ANALYSIS"] = "trend_analysis";
    QueryIntent["COMPARISON"] = "comparison";
    QueryIntent["AGGREGATION"] = "aggregation";
    QueryIntent["FILTERING"] = "filtering";
    QueryIntent["RANKING"] = "ranking";
    QueryIntent["FORECASTING"] = "forecasting";
    QueryIntent["ANOMALY_DETECTION"] = "anomaly_detection";
    QueryIntent["DRILL_DOWN"] = "drill_down";
    QueryIntent["SUMMARY"] = "summary";
    QueryIntent["CORRELATION"] = "correlation";
})(QueryIntent || (exports.QueryIntent = QueryIntent = {}));
var EntityType;
(function (EntityType) {
    EntityType["METRIC"] = "metric";
    EntityType["DIMENSION"] = "dimension";
    EntityType["TIME_PERIOD"] = "time_period";
    EntityType["COMPARISON_OPERATOR"] = "comparison_operator";
    EntityType["AGGREGATION_FUNCTION"] = "aggregation_function";
    EntityType["FILTER_VALUE"] = "filter_value";
    EntityType["BUSINESS_ENTITY"] = "business_entity";
})(EntityType || (exports.EntityType = EntityType = {}));
var TimeframeType;
(function (TimeframeType) {
    TimeframeType["ABSOLUTE"] = "absolute";
    TimeframeType["RELATIVE"] = "relative";
    TimeframeType["ROLLING"] = "rolling";
    TimeframeType["COMPARISON"] = "comparison";
})(TimeframeType || (exports.TimeframeType = TimeframeType = {}));
var RelativeTimeframe;
(function (RelativeTimeframe) {
    RelativeTimeframe["TODAY"] = "today";
    RelativeTimeframe["YESTERDAY"] = "yesterday";
    RelativeTimeframe["THIS_WEEK"] = "this_week";
    RelativeTimeframe["LAST_WEEK"] = "last_week";
    RelativeTimeframe["THIS_MONTH"] = "this_month";
    RelativeTimeframe["LAST_MONTH"] = "last_month";
    RelativeTimeframe["THIS_QUARTER"] = "this_quarter";
    RelativeTimeframe["LAST_QUARTER"] = "last_quarter";
    RelativeTimeframe["THIS_YEAR"] = "this_year";
    RelativeTimeframe["LAST_YEAR"] = "last_year";
    RelativeTimeframe["LAST_7_DAYS"] = "last_7_days";
    RelativeTimeframe["LAST_30_DAYS"] = "last_30_days";
    RelativeTimeframe["LAST_90_DAYS"] = "last_90_days";
    RelativeTimeframe["LAST_12_MONTHS"] = "last_12_months";
})(RelativeTimeframe || (exports.RelativeTimeframe = RelativeTimeframe = {}));
var TimePeriod;
(function (TimePeriod) {
    TimePeriod["HOUR"] = "hour";
    TimePeriod["DAY"] = "day";
    TimePeriod["WEEK"] = "week";
    TimePeriod["MONTH"] = "month";
    TimePeriod["QUARTER"] = "quarter";
    TimePeriod["YEAR"] = "year";
})(TimePeriod || (exports.TimePeriod = TimePeriod = {}));
var VisualizationType;
(function (VisualizationType) {
    VisualizationType["TABLE"] = "table";
    VisualizationType["LINE_CHART"] = "line_chart";
    VisualizationType["BAR_CHART"] = "bar_chart";
    VisualizationType["PIE_CHART"] = "pie_chart";
    VisualizationType["AREA_CHART"] = "area_chart";
    VisualizationType["SCATTER_PLOT"] = "scatter_plot";
    VisualizationType["HEATMAP"] = "heatmap";
    VisualizationType["GAUGE"] = "gauge";
    VisualizationType["KPI_CARD"] = "kpi_card";
    VisualizationType["FUNNEL"] = "funnel";
    VisualizationType["TREEMAP"] = "treemap";
})(VisualizationType || (exports.VisualizationType = VisualizationType = {}));
var ColumnType;
(function (ColumnType) {
    ColumnType["STRING"] = "string";
    ColumnType["NUMBER"] = "number";
    ColumnType["INTEGER"] = "integer";
    ColumnType["DECIMAL"] = "decimal";
    ColumnType["BOOLEAN"] = "boolean";
    ColumnType["DATE"] = "date";
    ColumnType["DATETIME"] = "datetime";
    ColumnType["CURRENCY"] = "currency";
    ColumnType["PERCENTAGE"] = "percentage";
})(ColumnType || (exports.ColumnType = ColumnType = {}));
var DetailLevel;
(function (DetailLevel) {
    DetailLevel["HIGH"] = "high";
    DetailLevel["MEDIUM"] = "medium";
    DetailLevel["LOW"] = "low";
})(DetailLevel || (exports.DetailLevel = DetailLevel = {}));
var InsightType;
(function (InsightType) {
    InsightType["TREND"] = "trend";
    InsightType["ANOMALY"] = "anomaly";
    InsightType["CORRELATION"] = "correlation";
    InsightType["SEASONAL_PATTERN"] = "seasonal_pattern";
    InsightType["THRESHOLD_ALERT"] = "threshold_alert";
    InsightType["COMPARATIVE_ANALYSIS"] = "comparative_analysis";
})(InsightType || (exports.InsightType = InsightType = {}));
var InsightSignificance;
(function (InsightSignificance) {
    InsightSignificance["HIGH"] = "high";
    InsightSignificance["MEDIUM"] = "medium";
    InsightSignificance["LOW"] = "low";
})(InsightSignificance || (exports.InsightSignificance = InsightSignificance = {}));
var VoiceStatus;
(function (VoiceStatus) {
    VoiceStatus["IDLE"] = "idle";
    VoiceStatus["LISTENING"] = "listening";
    VoiceStatus["PROCESSING"] = "processing";
    VoiceStatus["COMPLETED"] = "completed";
    VoiceStatus["ERROR"] = "error";
})(VoiceStatus || (exports.VoiceStatus = VoiceStatus = {}));
var SuggestionCategory;
(function (SuggestionCategory) {
    SuggestionCategory["POPULAR"] = "popular";
    SuggestionCategory["RECENT"] = "recent";
    SuggestionCategory["RECOMMENDED"] = "recommended";
    SuggestionCategory["TEMPLATE"] = "template";
    SuggestionCategory["SIMILAR"] = "similar";
})(SuggestionCategory || (exports.SuggestionCategory = SuggestionCategory = {}));
var VariableType;
(function (VariableType) {
    VariableType["STRING"] = "string";
    VariableType["NUMBER"] = "number";
    VariableType["DATE"] = "date";
    VariableType["ENUM"] = "enum";
    VariableType["BOOLEAN"] = "boolean";
})(VariableType || (exports.VariableType = VariableType = {}));
var ErrorType;
(function (ErrorType) {
    ErrorType["SYNTAX_ERROR"] = "syntax_error";
    ErrorType["INVALID_METRIC"] = "invalid_metric";
    ErrorType["INVALID_TIMEFRAME"] = "invalid_timeframe";
    ErrorType["PERMISSION_DENIED"] = "permission_denied";
    ErrorType["RESOURCE_LIMIT"] = "resource_limit";
    ErrorType["DATA_NOT_FOUND"] = "data_not_found";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
var WarningType;
(function (WarningType) {
    WarningType["PERFORMANCE"] = "performance";
    WarningType["DATA_QUALITY"] = "data_quality";
    WarningType["APPROXIMATION"] = "approximation";
    WarningType["DEPRECATED"] = "deprecated";
})(WarningType || (exports.WarningType = WarningType = {}));
var QueryComplexity;
(function (QueryComplexity) {
    QueryComplexity["LOW"] = "low";
    QueryComplexity["MEDIUM"] = "medium";
    QueryComplexity["HIGH"] = "high";
    QueryComplexity["VERY_HIGH"] = "very_high";
})(QueryComplexity || (exports.QueryComplexity = QueryComplexity = {}));
var AxisType;
(function (AxisType) {
    AxisType["CATEGORY"] = "category";
    AxisType["VALUE"] = "value";
    AxisType["TIME"] = "time";
    AxisType["LOG"] = "log";
})(AxisType || (exports.AxisType = AxisType = {}));
var ScaleType;
(function (ScaleType) {
    ScaleType["LINEAR"] = "linear";
    ScaleType["LOG"] = "log";
    ScaleType["TIME"] = "time";
})(ScaleType || (exports.ScaleType = ScaleType = {}));
var SeriesType;
(function (SeriesType) {
    SeriesType["LINE"] = "line";
    SeriesType["BAR"] = "bar";
    SeriesType["AREA"] = "area";
    SeriesType["SCATTER"] = "scatter";
})(SeriesType || (exports.SeriesType = SeriesType = {}));
var AggregationType;
(function (AggregationType) {
    AggregationType["SUM"] = "sum";
    AggregationType["AVG"] = "avg";
    AggregationType["COUNT"] = "count";
    AggregationType["MIN"] = "min";
    AggregationType["MAX"] = "max";
    AggregationType["MEDIAN"] = "median";
})(AggregationType || (exports.AggregationType = AggregationType = {}));
var ChartTheme;
(function (ChartTheme) {
    ChartTheme["LIGHT"] = "light";
    ChartTheme["DARK"] = "dark";
    ChartTheme["COLORFUL"] = "colorful";
    ChartTheme["MINIMAL"] = "minimal";
})(ChartTheme || (exports.ChartTheme = ChartTheme = {}));
var AnnotationType;
(function (AnnotationType) {
    AnnotationType["LINE"] = "line";
    AnnotationType["AREA"] = "area";
    AnnotationType["POINT"] = "point";
    AnnotationType["TEXT"] = "text";
})(AnnotationType || (exports.AnnotationType = AnnotationType = {}));
var AnnotationStyle;
(function (AnnotationStyle) {
    AnnotationStyle["SOLID"] = "solid";
    AnnotationStyle["DASHED"] = "dashed";
    AnnotationStyle["DOTTED"] = "dotted";
})(AnnotationStyle || (exports.AnnotationStyle = AnnotationStyle = {}));
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "equals";
    FilterOperator["NOT_EQUALS"] = "not_equals";
    FilterOperator["GREATER_THAN"] = "greater_than";
    FilterOperator["GREATER_THAN_EQUAL"] = "greater_than_equal";
    FilterOperator["LESS_THAN"] = "less_than";
    FilterOperator["LESS_THAN_EQUAL"] = "less_than_equal";
    FilterOperator["CONTAINS"] = "contains";
    FilterOperator["NOT_CONTAINS"] = "not_contains";
    FilterOperator["IN"] = "in";
    FilterOperator["NOT_IN"] = "not_in";
    FilterOperator["BETWEEN"] = "between";
    FilterOperator["IS_NULL"] = "is_null";
    FilterOperator["IS_NOT_NULL"] = "is_not_null";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
var FilterType;
(function (FilterType) {
    FilterType["TEXT"] = "text";
    FilterType["NUMBER"] = "number";
    FilterType["DATE"] = "date";
    FilterType["BOOLEAN"] = "boolean";
    FilterType["ENUM"] = "enum";
})(FilterType || (exports.FilterType = FilterType = {}));
//# sourceMappingURL=query.js.map