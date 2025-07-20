/**
 * Core Types for AI-Powered Business Intelligence Platform
 * Defines the foundational data structures for SME business contexts
 */

// ==================== User & Authentication Types ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dashboardLayout: string[];
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  insights: boolean;
  reports: boolean;
  alerts: boolean;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'analyst' | 'viewer';

// ==================== Tenant & Multi-tenancy Types ====================

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  industry: IndustryType;
  companySize: CompanySize;
  subscription: Subscription;
  settings: TenantSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  features: {
    aiInsights: boolean;
    advancedAnalytics: boolean;
    industryTemplates: boolean;
    customReports: boolean;
  };
  dataRetentionDays: number;
  maxUsers: number;
}

export type IndustryType = 
  | 'retail'
  | 'professional-services'
  | 'manufacturing'
  | 'healthcare'
  | 'education'
  | 'hospitality'
  | 'technology'
  | 'finance'
  | 'other';

export type CompanySize = '1-10' | '11-50' | '51-250' | '251-1000' | '1000+';

// ==================== Subscription & Billing Types ====================

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  usage: UsageMetrics;
}

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface UsageMetrics {
  aiQueries: number;
  dataPoints: number;
  reports: number;
  users: number;
  storage: number; // in MB
}

// ==================== Business Data Types ====================

export interface BusinessMetric {
  id: string;
  tenantId: string;
  name: string;
  value: number;
  previousValue?: number;
  unit: string;
  category: MetricCategory;
  period: TimePeriod;
  timestamp: Date;
  confidence?: number; // AI confidence score 0-1
  source: DataSource;
}

export type MetricCategory = 
  | 'revenue'
  | 'expenses'
  | 'customers'
  | 'inventory'
  | 'employees'
  | 'operations'
  | 'marketing'
  | 'sales';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface DataSource {
  type: 'manual' | 'integration' | 'upload' | 'ai-generated';
  name: string;
  lastSyncAt?: Date;
  isActive: boolean;
}

// ==================== AI/ML Types ====================

export interface AIInsight {
  id: string;
  tenantId: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: InsightImpact;
  actionable: boolean;
  recommendations: string[];
  relatedMetrics: string[]; // metric IDs
  createdAt: Date;
  status: InsightStatus;
  userFeedback?: InsightFeedback;
}

export type InsightType = 
  | 'trend'
  | 'anomaly'
  | 'forecast'
  | 'opportunity'
  | 'risk'
  | 'benchmark';

export type InsightImpact = 'low' | 'medium' | 'high' | 'critical';
export type InsightStatus = 'new' | 'viewed' | 'acted_on' | 'dismissed';

export interface InsightFeedback {
  helpful: boolean;
  accurate: boolean;
  comment?: string;
  submittedAt: Date;
}

export interface AIAnalysisRequest {
  tenantId: string;
  query: string;
  context: {
    metrics: BusinessMetric[];
    timeRange: DateRange;
    industry: IndustryType;
  };
  preferences: {
    includeForecasts: boolean;
    includeRecommendations: boolean;
    confidenceThreshold: number;
  };
}

export interface AIAnalysisResponse {
  insights: AIInsight[];
  summary: string;
  confidence: number;
  processingTime: number;
  tokensUsed?: number;
}

// ==================== Dashboard & Visualization Types ====================

export interface Dashboard {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  widgets: Widget[];
  layout: DashboardLayout;
  isDefault: boolean;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: WidgetPosition;
  dataQuery: DataQuery;
}

export type WidgetType = 
  | 'metric'
  | 'chart'
  | 'table'
  | 'insight'
  | 'kpi'
  | 'forecast';

export interface WidgetConfig {
  chartType?: ChartType;
  showTrend?: boolean;
  showComparison?: boolean;
  timeRange?: DateRange;
  filters?: Record<string, any>;
  styling?: WidgetStyling;
}

export type ChartType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'heatmap'
  | 'gauge';

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetStyling {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  isDraggable: boolean;
  isResizable: boolean;
}

export interface DataQuery {
  metrics: string[];
  filters: QueryFilter[];
  groupBy?: string[];
  orderBy?: QueryOrder[];
  limit?: number;
  timeRange: DateRange;
}

export interface QueryFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export type FilterOperator = 
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' 
  | 'in' | 'nin' | 'contains' | 'between';

export interface QueryOrder {
  field: string;
  direction: 'asc' | 'desc';
}

// ==================== Report Types ====================

export interface Report {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  template: ReportTemplate;
  schedule?: ReportSchedule;
  recipients: string[];
  status: ReportStatus;
  lastGeneratedAt?: Date;
  nextScheduledAt?: Date;
  config: ReportConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  industry?: IndustryType;
  sections: ReportSection[];
  isDefault: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  content: SectionContent;
  order: number;
}

export type SectionType = 
  | 'summary'
  | 'metrics'
  | 'chart'
  | 'insights'
  | 'recommendations'
  | 'forecast';

export interface SectionContent {
  query?: DataQuery;
  text?: string;
  widgets?: string[];
  insights?: string[];
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  hour: number; // 0-23
  timezone: string;
  isActive: boolean;
}

export type ReportStatus = 
  | 'draft'
  | 'scheduled'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface ReportConfig {
  format: 'pdf' | 'excel' | 'html';
  includeCharts: boolean;
  includeInsights: boolean;
  branding: boolean;
  pageSize: 'a4' | 'letter';
}

// ==================== Utility Types ====================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

// ==================== Industry-Specific Types ====================

export interface IndustryTemplate {
  id: string;
  industry: IndustryType;
  name: string;
  description: string;
  defaultMetrics: string[];
  defaultDashboards: Partial<Dashboard>[];
  defaultReports: Partial<ReportTemplate>[];
  kpiTargets: KPITarget[];
}

export interface KPITarget {
  metricId: string;
  target: number;
  threshold: number;
  period: TimePeriod;
  isActive: boolean;
}
