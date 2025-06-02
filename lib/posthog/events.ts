// Event categories for organized tracking
export enum EventCategory {
  AUTH = "auth",
  FORM = "form",
  SESSION = "session",
  NAVIGATION = "navigation",
  ERROR = "error",
  USER_INTERACTION = "user_interaction",
  ADMIN = "admin",
}

// Authentication events
export enum AuthEvent {
  SIGNUP_STARTED = "signup_started",
  SIGNUP_STEP_COMPLETED = "signup_step_completed",
  SIGNUP_COMPLETED = "signup_completed",
  SIGNUP_FAILED = "signup_failed",
  LOGIN_STARTED = "login_started",
  LOGIN_COMPLETED = "login_completed",
  LOGIN_FAILED = "login_failed",
  LOGOUT = "logout",
  GOOGLE_AUTH_STARTED = "google_auth_started",
  GOOGLE_AUTH_COMPLETED = "google_auth_completed",
  GOOGLE_AUTH_FAILED = "google_auth_failed",
  PASSWORD_RESET_REQUESTED = "password_reset_requested",
  PASSWORD_RESET_COMPLETED = "password_reset_completed",
  EMAIL_VERIFICATION_SENT = "email_verification_sent",
  EMAIL_VERIFIED = "email_verified",
}

// Form interaction events
export enum FormEvent {
  FORM_STARTED = "form_started",
  FORM_SUBMITTED = "form_submitted",
  FORM_VALIDATION_ERROR = "form_validation_error",
  FIELD_FOCUSED = "field_focused",
  FIELD_BLURRED = "field_blurred",
  FIELD_ERROR = "field_error",
  STEP_NAVIGATION = "step_navigation",
  PROMO_CODE_ENTERED = "promo_code_entered",
  PROMO_CODE_VALIDATED = "promo_code_validated",
  PAYMENT_METHOD_SELECTED = "payment_method_selected",
}

// Session events
export enum SessionEvent {
  SESSION_STARTED = "session_started",
  SESSION_ENDED = "session_ended",
  SESSION_EXTENDED = "session_extended",
  SESSION_TIMEOUT = "session_timeout",
  PAGE_VIEW = "page_view",
  PAGE_EXIT = "page_exit",
  SESSION_HEARTBEAT = "session_heartbeat",
}

// Error events
export enum ErrorEvent {
  API_ERROR = "api_error",
  VALIDATION_ERROR = "validation_error",
  NETWORK_ERROR = "network_error",
  AUTHENTICATION_ERROR = "authentication_error",
  PERMISSION_ERROR = "permission_error",
  SYSTEM_ERROR = "system_error",
  JAVASCRIPT_ERROR = "javascript_error",
}

// User interaction events
export enum InteractionEvent {
  BUTTON_CLICK = "button_click",
  LINK_CLICK = "link_click",
  MENU_OPENED = "menu_opened",
  MODAL_OPENED = "modal_opened",
  MODAL_CLOSED = "modal_closed",
  TAB_SWITCHED = "tab_switched",
  SEARCH_PERFORMED = "search_performed",
  FILE_UPLOADED = "file_uploaded",
  DROPDOWN_OPENED = "dropdown_opened",
}

// Navigation events
export enum NavigationEvent {
  PAGE_VISITED = "page_visited",
  ROUTE_CHANGED = "route_changed",
  EXTERNAL_LINK_CLICKED = "external_link_clicked",
  BACK_BUTTON_CLICKED = "back_button_clicked",
  BREADCRUMB_CLICKED = "breadcrumb_clicked",
}

// Event properties interface
export interface BaseEventProperties {
  timestamp: string;
  session_id: string;
  user_id?: string;
  page_url: string;
  user_agent?: string;
  referrer?: string;
  [key: string]: any;
}

export interface AuthEventProperties extends BaseEventProperties {
  auth_method?:
    | "email"
    | "google"
    | "password_reset"
    | "manual_reset"
    | "force_clean"
    | "authenticated"
    | "anonymous";
  step?: number;
  total_steps?: number;
  error_message?: string;
  email_domain?: string;
}

export interface FormEventProperties extends BaseEventProperties {
  form_name: string;
  form_step?: number;
  field_name?: string;
  field_type?: string;
  error_type?: string;
  error_message?: string;
  validation_errors?: string[];
  form_duration?: number;
  promo_code?: string;
  payment_method?: string;
}

export interface SessionEventProperties extends BaseEventProperties {
  session_duration?: number;
  pages_visited?: number;
  interactions_count?: number;
  last_activity?: string;
  session_type?: "new" | "returning";
  device_type?: "mobile" | "tablet" | "desktop";
}

export interface ErrorEventProperties extends BaseEventProperties {
  error_message: string;
  error_code?: string;
  error_stack?: string;
  error_source?: string;
  api_endpoint?: string;
  http_status?: number;
  retry_count?: number;
}

export interface InteractionEventProperties extends BaseEventProperties {
  element_type: string;
  element_text?: string;
  element_id?: string;
  element_class?: string;
  element_position?: { x: number; y: number };
  interaction_context?: string;
}

export interface NavigationEventProperties extends BaseEventProperties {
  from_page?: string;
  to_page: string;
  navigation_type?: "programmatic" | "user_initiated";
  load_time?: number;
}

// Union type for all event properties
export type EventProperties =
  | AuthEventProperties
  | FormEventProperties
  | SessionEventProperties
  | ErrorEventProperties
  | InteractionEventProperties
  | NavigationEventProperties;
