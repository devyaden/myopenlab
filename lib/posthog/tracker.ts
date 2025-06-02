import posthog from "posthog-js";
import { v4 as uuidv4 } from "uuid";
import {
  EventCategory,
  AuthEvent,
  FormEvent,
  SessionEvent,
  ErrorEvent,
  InteractionEvent,
  NavigationEvent,
  BaseEventProperties,
  AuthEventProperties,
  FormEventProperties,
  SessionEventProperties,
  ErrorEventProperties,
  InteractionEventProperties,
  NavigationEventProperties,
} from "./events";

class PostHogTracker {
  private sessionId: string;
  private sessionStartTime: number;
  private pageViewCount: number = 0;
  private interactionCount: number = 0;
  private lastActivityTime: number;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.setupSessionTracking();
  }

  private getOrCreateSessionId(): string {
    const sessionKey = "posthog_session_id";
    let sessionId = sessionStorage.getItem(sessionKey);

    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem(sessionKey, sessionId);
    }

    return sessionId;
  }

  private setupSessionTracking() {
    // Track session start
    this.trackSession(SessionEvent.SESSION_STARTED, {
      session_type: this.isReturningUser() ? "returning" : "new",
      device_type: this.getDeviceType(),
    });

    // Setup heartbeat every 30 seconds
    setInterval(() => {
      this.trackSessionHeartbeat();
    }, 30000);

    // Track session end on page unload
    window.addEventListener("beforeunload", () => {
      this.endSession();
    });

    // Track session end on visibility change (tab close/minimize)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.endSession();
      }
    });
  }

  private isReturningUser(): boolean {
    return localStorage.getItem("user_has_visited") === "true";
  }

  private getDeviceType(): "mobile" | "tablet" | "desktop" {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? "tablet" : "mobile";
    }
    return "desktop";
  }

  private getBaseProperties(): BaseEventProperties {
    return {
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
    };
  }

  private updateActivity() {
    this.lastActivityTime = Date.now();
    this.interactionCount++;
  }

  // Authentication tracking methods
  trackAuth(event: AuthEvent, properties: Partial<AuthEventProperties> = {}) {
    const authProperties: AuthEventProperties = {
      ...this.getBaseProperties(),
      ...properties,
    };

    posthog.capture(`${EventCategory.AUTH}_${event}`, authProperties);
    this.updateActivity();
  }

  // Form tracking methods
  trackForm(event: FormEvent, properties: Partial<FormEventProperties>) {
    const formProperties: FormEventProperties = {
      ...this.getBaseProperties(),
      form_name: properties.form_name || "unknown",
      ...properties,
    };

    posthog.capture(`${EventCategory.FORM}_${event}`, formProperties);
    this.updateActivity();
  }

  // Session tracking methods
  trackSession(
    event: SessionEvent,
    properties: Partial<SessionEventProperties> = {}
  ) {
    const sessionProperties: SessionEventProperties = {
      ...this.getBaseProperties(),
      session_duration: Date.now() - this.sessionStartTime,
      pages_visited: this.pageViewCount,
      interactions_count: this.interactionCount,
      last_activity: new Date(this.lastActivityTime).toISOString(),
      ...properties,
    };

    posthog.capture(`${EventCategory.SESSION}_${event}`, sessionProperties);
  }

  private trackSessionHeartbeat() {
    this.trackSession(SessionEvent.SESSION_HEARTBEAT);
  }

  // Error tracking methods
  trackError(event: ErrorEvent, properties: Partial<ErrorEventProperties>) {
    const errorProperties: ErrorEventProperties = {
      ...this.getBaseProperties(),
      error_message: properties.error_message || "Unknown error",
      ...properties,
    };

    posthog.capture(`${EventCategory.ERROR}_${event}`, errorProperties);
    this.updateActivity();
  }

  // Interaction tracking methods
  trackInteraction(
    event: InteractionEvent,
    properties: Partial<InteractionEventProperties>
  ) {
    const interactionProperties: InteractionEventProperties = {
      ...this.getBaseProperties(),
      element_type: properties.element_type || "unknown",
      ...properties,
    };

    posthog.capture(
      `${EventCategory.USER_INTERACTION}_${event}`,
      interactionProperties
    );
    this.updateActivity();
  }

  // Navigation tracking methods
  trackNavigation(
    event: NavigationEvent,
    properties: Partial<NavigationEventProperties>
  ) {
    const navigationProperties: NavigationEventProperties = {
      ...this.getBaseProperties(),
      to_page: properties.to_page || window.location.pathname,
      ...properties,
    };

    posthog.capture(
      `${EventCategory.NAVIGATION}_${event}`,
      navigationProperties
    );
    this.updateActivity();

    if (event === NavigationEvent.PAGE_VISITED) {
      this.pageViewCount++;
    }
  }

  // Utility methods for common tracking scenarios
  trackButtonClick(buttonText: string, buttonId?: string, context?: string) {
    this.trackInteraction(InteractionEvent.BUTTON_CLICK, {
      element_type: "button",
      element_text: buttonText,
      element_id: buttonId,
      interaction_context: context,
    });
  }

  trackFormError(
    formName: string,
    fieldName: string,
    errorMessage: string,
    step?: number
  ) {
    this.trackForm(FormEvent.FIELD_ERROR, {
      form_name: formName,
      field_name: fieldName,
      error_message: errorMessage,
      form_step: step,
    });
  }

  trackFormValidationError(
    formName: string,
    validationErrors: string[],
    step?: number
  ) {
    this.trackForm(FormEvent.FORM_VALIDATION_ERROR, {
      form_name: formName,
      validation_errors: validationErrors,
      form_step: step,
    });
  }

  trackAPIError(
    endpoint: string,
    errorMessage: string,
    statusCode?: number,
    retryCount?: number
  ) {
    this.trackError(ErrorEvent.API_ERROR, {
      error_message: errorMessage,
      api_endpoint: endpoint,
      http_status: statusCode,
      retry_count: retryCount,
    });
  }

  trackJavaScriptError(error: Error, source?: string) {
    this.trackError(ErrorEvent.JAVASCRIPT_ERROR, {
      error_message: error.message,
      error_stack: error.stack,
      error_source: source,
    });
  }

  // Method to set user properties
  identifyUser(userId: string, userProperties: Record<string, any> = {}) {
    posthog.identify(userId, {
      ...userProperties,
      first_seen: new Date().toISOString(),
    });

    localStorage.setItem("user_has_visited", "true");
  }

  // Method to end session
  endSession() {
    this.trackSession(SessionEvent.SESSION_ENDED, {
      session_duration: Date.now() - this.sessionStartTime,
      pages_visited: this.pageViewCount,
      interactions_count: this.interactionCount,
    });
  }

  // Method to get current session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStartTime,
      pageViews: this.pageViewCount,
      interactions: this.interactionCount,
      lastActivity: this.lastActivityTime,
    };
  }
}

// Create singleton instance
export const tracker = new PostHogTracker();

// Error boundary integration
export const trackUnhandledError = (error: Error, errorInfo?: any) => {
  tracker.trackJavaScriptError(error, "unhandled_error");
};

// Setup global error handlers
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    tracker.trackJavaScriptError(new Error(event.message), event.filename);
  });

  window.addEventListener("unhandledrejection", (event) => {
    tracker.trackJavaScriptError(
      new Error(event.reason),
      "unhandled_promise_rejection"
    );
  });
}
