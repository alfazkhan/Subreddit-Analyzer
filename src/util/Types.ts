// Type definitions for Redux slices and components

// Subreddit types
export interface Subreddit {
  id: number;
  name: string;
}

export interface SubredditSummary {
  id: number;
  count: number;
  last_updated: string;
}

// User input state for form components
export interface UserInputState {
  subredditID: number | null;
  subredditName: string;
  targetPostCount: number;
  useOnlyCache: boolean;
}

// Server status and cache types
export interface ServerStatusState {
  serverStatus: "checking" | "online" | "offline";
  cacheSummary: Record<string, SubredditSummary>;
  latestSummary: Record<string, SubredditSummary>;
  changeSinceLastLoad: Record<string, number>;
  recentLogs: LogEntry[];
  fetchError?: FetchError;
}

export interface AuthState {
  user: {
    uid: string;
    email: string | null;
    name?: string;
  } | null;
  token: string | null;
  role: string;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RootState {
  userInputState: UserInputState;
  serverStatusState: ServerStatusState;
  authState: AuthState;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'error' | 'info' | 'success';
  message: string;
}

export interface FetchError {
  code: number;
  message: string;
  details?: Record<string, unknown>;
}

// Redux action types for user input slice
export interface UserInputActions {
  handleIDChange: (id: number) => void;
  handleNameChange: (name: string) => void;
  handleCountChange: (count: number) => void;
  toggleCachingChange: (value: boolean) => void;
}

export interface UserInputReducer {
  subredditID: number | null;
  subredditName: string;
  targetPostCount: number;
  useOnlyCache: boolean;
}

// Component props types for UserInput component
export interface UserInputComponentProps {
  onFetchData: (subredditName: string, postCount: number) => void;
  processingStatus: boolean;
}

export interface SubredditsSummaryProps {
  showDashboard: boolean;
  toggleDashboard: () => void;
}

export interface ProgressBarProps {
  progressValue: number;
}

export interface UiProgressBarProps {
  value: number;
  processingStatus: string;
}

// Navbar props types
export interface NavbarProps {
  activeSection?: string;
  isDarkMode?: boolean;
}

// Header interface for type definitions
export interface HeaderType {
  text: string;
  highlight?: string;
}

// ProtectedRoute component props
export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

// Login component types
export interface LoginFormState {
  email: string;
  password: string;
  errorMsg: string;
  visible: boolean;
  loading: boolean;
}

export interface UserCredentials {
  user: {
    uid: string;
    email: string;
  };
}

export interface DbUser {
  name: string;
  role: string;
}

export interface AuthCredentials {
  user: {
    uid: string;
    email: string;
    name: string;
  };
  token: string;
  role: string;
}

// AboutProject component types
export interface AboutProjectProps {
  // No props currently, but keeping for future extensibility
}

// AlertDialog component types
export interface AlertDialogHandle {
  open: () => void;
  close: () => void;
}

export interface AlertDialogProps {
  onDelete: (id: number | string) => void;
  id: number | string;
  message: string;
}

// ColorMode types
export interface ColorModeContextValue {
  colorMode: string | undefined;
  setColorMode: (theme: string) => void;
  toggleColorMode: () => void;
}

export interface ColorModeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Additional props if needed
}

// DateSelector component types
export interface DateSelectorProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

// EditableInput component types
export interface EditableInputProps {
  fieldValue: string;
}

// FormDialog component types
export interface FormDialogProps {
  title: string;
  triggerText: string;
  initialValues: UserFormValues;
  children: (props: {
    values: UserFormValues;
    onChange: (name: string, value: string | number) => void;
  }) => React.ReactNode;
  onFormSuccess: () => void;
  mode: "new" | "edit";
}

export interface UserFormValues {
  id?: number | string;
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  api_calls_count?: number;
  api_calls_limit?: number;
  [key: string]: string | number | undefined;
}

export interface MutationBody {
  endpoint: string;
  signal: AbortSignal | undefined;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

// Header component types
export interface HeaderProps {
  text: string;
  highlight?: string;
}

// LoadingAndError component types
export interface LoadingAndErrorProps {
  isLoading: boolean;
  isError: boolean;
  error: (Error & { status?: string | number }) | null;
}

// Logs component types
export interface LogsProps {
  // No props currently
}

// Provider component types
export interface ChakraUIProviderProps {
  children: React.ReactNode;
}

// ServerStatus component types
export interface ServerStatusConfig {
  checking: {
    colorPalette: string;
    variant: "solid";
    text: string;
    color: string;
  };
  online: {
    colorPalette: string;
    variant: "solid";
    text: string;
    color: string;
  };
  offline: {
    colorPalette: string;
    variant: "solid";
    text: string;
    color: string;
  };
}

// TimeZoneSelect component types
export interface TimeZoneSelectProps {
  onTimeZoneChange: (timezone: string) => void;
  currentTimeZone: string;
}

// Toaster component types
export interface ToasterProps {
  // No props currently
}

// Tooltip component types
export interface TooltipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  showArrow?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  portalled?: boolean;
  content: React.ReactNode;
  contentProps?: React.HTMLAttributes<HTMLDivElement>;
  portalRef?: React.RefObject<HTMLDivElement>;
}

// DataPagination component types
export interface DataPaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

// Admin dashboard data types
export type AdminUserRole = "Super Admin" | "Admin" | "Guest User" | "Developer";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminUserRole | string;
  api_key: string | null;
  api_calls_count: number;
  api_calls_limit: number;
}

export interface AdminSubreddit {
  id: number;
  name: string;
  description: string | null;
  total_users: number;
  is_active: boolean;
  keep_updated: boolean;
  last_scanned: string | null;
}

export interface IgnoredWord {
  id: number;
  word: string;
  language: string;
  processed: boolean;
  approved: boolean;
  reported?: boolean;
}

export interface ProcessQueueTask {
  id?: number | string;
  post_id: string;
  subreddit_name: string;
  status: string;
  retry_count?: number | null;
  created_at?: string | null;
}

export interface QueueCounts {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface QueueApiResponse {
  counts?: Partial<QueueCounts>;
  tasks?: ProcessQueueTask[];
}

export interface QueueSocketMessage {
  type: string;
  counts?: Partial<QueueCounts>;
  data?: ProcessQueueTask[];
}

export interface ReanalyzeSocketMessage {
  type: string;
  percent?: number;
  total?: number;
  processed?: number;
  message: string;
  current_status?: string;
}

export interface DeleteUserProps {
  user: AdminUser;
  onDeleteSuccess: (user: AdminUser) => void;
}

export interface EditUserProps {
  initialUserValues: AdminUser;
}

export interface SubredditsTableFiltersProps {
  table?: import("@tanstack/react-table").Table<AdminSubreddit>;
}

export interface IgnoredWordsTableFiltersProps {
  table?: import("@tanstack/react-table").Table<IgnoredWord>;
}

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  rootProps?: Record<string, unknown>;
  defaultVisible?: boolean;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  visibilityIcon?: {
    on: React.ReactNode;
    off: React.ReactNode;
  };
}

export type SentimentLabel = "Positive" | "Neutral" | "Negative";

export interface PostTopics {
  primary_topic?: string;
  labels: string[];
  scores: number[];
}

export interface RedditPost {
  id: string;
  subreddit: string;
  subreddit_name?: string;
  title: string;
  body: string;
  timestamp: string;
  sentiment?: SentimentLabel | null;
  topics?: PostTopics | string | null;
  entities?: string | null;
  score?: number;
  upvote_ratio?: number;
  num_comments?: number;
}

export interface KeywordItem {
  word: string;
  frequency: number;
  reported?: boolean;
  sentiment_distribution?: Partial<Record<Lowercase<SentimentLabel>, number>>;
}

export interface KeywordTableControlProps {
  table: import("@tanstack/react-table").Table<KeywordItem>;
}

export interface KeywordReportCellProps {
  row: import("@tanstack/react-table").Row<KeywordItem>;
}

export interface PostsTableProps {
  data: RedditPost[];
}

export interface PostEntity {
  label: string;
  text: string;
}

export interface EntityLabelDisplay {
  type: string;
  description: string;
  color: string;
}

export interface SentimentAnalyticsResponse {
  overall?: {
    total_posts: number;
    counts?: Partial<Record<SentimentLabel, number>>;
    percentages?: Partial<Record<SentimentLabel, number>>;
  };
}

export interface HourlyPostFrequencyResponse {
  labels?: string[];
  metrics?: { post_volumes?: number[] };
}

export interface HourlySentimentFrequencyResponse {
  labels?: string[];
  metrics?: {
    positive_counts?: number[];
    negative_counts?: number[];
    post_volumes?: number[];
  };
}

export interface PostTitleCellProps {
  row: import("@tanstack/react-table").Row<RedditPost>;
}

export interface PostTableFilterProps {
  sentiment: string;
  onSentimentChange: (sentiment: string) => void;
  topics: string;
  onTopicsChange: (topic: string) => void;
}

export interface DataTabsProps {
  postsData: RedditPost[];
  processingStatus: boolean;
}

export interface SubredditAnalyticsProps {
  subreddit?: string;
}

export interface PaginatedPostsResponse {
  items: RedditPost[];
  next_cursor: string | null;
  prev_cursor: string | null;
  has_more: boolean;
}

export interface PaginationButtonsProps {
  data: PaginatedPostsResponse;
  onFetchPosts: (cursor?: string | null, direction?: "next" | "prev") => void;
  isPending: boolean;
  limit: number;
  postPerPageChange: (limit: number) => void;
}

export interface PostTableCellProps {
  bodyContent: string;
}

export interface PostTimestampProps {
  timestamp: string;
}

export interface TopicsCellProps {
  topics: PostTopics | null | undefined;
}

export interface PasswordStrengthMeterProps {
  max?: number;
  value: number;
}

export type PasswordVisibilityTriggerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "size"
>;

export interface FeatureTask {
  id: string;
  title: string;
  type: string;
}

export interface FeatureColumn {
  id: string;
  title: string;
  cards: FeatureTask[];
}

export interface FeatureCsvRow {
  Status: string;
  Task: string;
  Type: string;
}

export interface ThesisStats {
  [key: string]: string | number | boolean;
}

// ========================================
// UTILITY FUNCTIONS TYPES
// ========================================

// ========================================
// UTILITY FUNCTIONS TYPES
// ========================================

// HTTP Functions Types (http.ts)
export interface FetchDataOptions {
  endpoint: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  progressCallBackFn?: (progress: number) => void;
}

export interface SendingDataOptions {
  endpoint: string;
  signal?: AbortSignal;
  body: unknown;
  headers?: Record<string, string>;
}

export interface EditingDataOptions {
  endpoint: string;
  signal?: AbortSignal;
  body: unknown;
  headers?: Record<string, string>;
}

export interface DeletingDataOptions {
  endpoint: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

// formatTime.js types
export interface FormatTimeOptions {
  seconds: number;
}

// getTopKeywords.ts types
export type KeywordCountData = Record<string, number>;

export type MinMaxSetter = (value: number) => void;

// paginationDataSlicer.ts types
export type PaginationDataSlicer = <T>(
  data: T[] | undefined | null,
  currentPage: number,
  pageSize: number
) => T[] | undefined;

// keywordCount.js types
export interface KeywordCountResult {
  [key: string]: number;
}

export interface KeywordCountInputData {
  post: {
    keywords?: string;
  };
}

// paginationDataSlicer.ts types

// tempKeywordEntitiesFix.js types
export interface TempKeywordEntitiesFixOptions {
  text: string;
}

export interface TempKeywordEntitiesFixResult {
  fixedText: string;
}

// ========================================
// APP AND MAIN.TSX TYPES
// ========================================

import { ReactNode } from 'react';
import type { ComponentType, createElement as reactCreateElement, ReactElement as ReactDomElement } from 'react';

// App component types
export interface AppProps {
  children: ReactNode;
}

// Main entry point type (main.tsx)
export interface ReactDOMCreateRootOptions {
  container: HTMLElement | null;
}

export interface ReactDOMRenderOutput {
  rootNode: RenderRoot;
}

export interface RenderRoot {
  childNodes: RenderChild[];
}

export interface RenderChild {
  type: string | ComponentType<any> | ReactDomElement;
  key?: string;
  ref?: React.RefObject<HTMLElement>;
  domElement?: HTMLElement | null;
}

// ========================================
// CONSTANTS.JS TYPES
// ========================================

export interface ConstantsTypes {
  BASE_URL: string;
  wsUrl: string;
}

export interface EnvModeType {
  PROD: boolean;
}

// Default constants values for development
export const DEFAULT_BASE_URL = 'http://192.168.0.246:8000';
export const DEFAULT_WS_URL = 'ws://192.168.0.246:8000/ws/reanalyze';

// Production constants (type only, values in Constants.js)
export const PROD_BASE_URL = 'https://api.theonlyalfaz.com';
export const PROD_WS_URL = 'wss://api.theonlyalfaz.com/ws/reanalyze';