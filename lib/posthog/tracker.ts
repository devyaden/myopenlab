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

// Safe browser API access helpers
const safeGetItem = (
  storage: "localStorage" | "sessionStorage",
  key: string
): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (
  storage: "localStorage" | "sessionStorage",
  key: string,
  value: string
): void => {
  if (typeof window === "undefined") return;
  try {
    window[storage].setItem(key, value);
  } catch {
    // Silently fail
  }
};

const safeRemoveItem = (
  storage: "localStorage" | "sessionStorage",
  key: string
): void => {
  if (typeof window === "undefined") return;
  try {
    window[storage].removeItem(key);
  } catch {
    // Silently fail
  }
};

// Safe PostHog access
const safePostHogCapture = (eventName: string, properties: any): void => {
  if (typeof window === "undefined") return;

  try {
    // Dynamic import to avoid SSR issues
    import("posthog-js")
      .then((posthogModule) => {
        const posthog = posthogModule.default;
        if (posthog && typeof posthog.capture === "function") {
          posthog.capture(eventName, properties);
        }
      })
      .catch(() => {
        // Silently fail if PostHog not available
      });
  } catch {
    // Silently fail
  }
};

const safePostHogIdentify = (userId: string, properties: any): void => {
  if (typeof window === "undefined") return;

  try {
    import("posthog-js")
      .then((posthogModule) => {
        const posthog = posthogModule.default;
        if (posthog && typeof posthog.identify === "function") {
          posthog.identify(userId, properties);
        }
      })
      .catch(() => {
        // Silently fail if PostHog not available
      });
  } catch {
    // Silently fail
  }
};

class PostHogTracker {
  private sessionId: string = "";
  private sessionStartTime: number = 0;
  private pageViewCount: number = 0;
  private interactionCount: number = 0;
  private lastActivityTime: number = 0;
  private isInitialized: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Don't initialize anything here - wait for browser
  }

  initializeInBrowser(): void {
    if (typeof window === "undefined" || this.isInitialized) return;

    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.setupSessionTracking();
    this.isInitialized = true;
  }

  private getOrCreateSessionId(): string {
    if (typeof window === "undefined") return "";

    const sessionKey = "posthog_session_id";
    let sessionId = safeGetItem("sessionStorage", sessionKey);

    if (!sessionId) {
      // Generate UUID without external dependency
      sessionId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c == "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
      safeSetItem("sessionStorage", sessionKey, sessionId);
    }

    return sessionId;
  }

  private setupSessionTracking(): void {
    if (typeof window === "undefined") return;

    // Track session start
    this.trackSession(SessionEvent.SESSION_STARTED, {
      session_type: this.isReturningUser() ? "returning" : "new",
      device_type: this.getDeviceType(),
    });

    // Setup heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.trackSessionHeartbeat();
    }, 30000);

    // Track session end on page unload
    const handleBeforeUnload = () => {
      this.endSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        this.endSession();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    if (typeof window !== "undefined" && "addEventListener" in window) {
      const cleanup = () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
        }
      };

      // Store cleanup function for potential later use
      (window as any).__posthog_cleanup = cleanup;
    }
  }

  private isReturningUser(): boolean {
    return safeGetItem("localStorage", "user_has_visited") === "true";
  }

  private getDeviceType(): "mobile" | "tablet" | "desktop" {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return "desktop";
    }

    try {
      const userAgent = navigator.userAgent;
      if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        return /iPad/.test(userAgent) ? "tablet" : "mobile";
      }
      return "desktop";
    } catch {
      return "desktop";
    }
  }

  private getBaseProperties(): BaseEventProperties {
    const baseProps: BaseEventProperties = {
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      page_url: "",
      user_agent: "",
      referrer: "",
    };

    if (typeof window !== "undefined") {
      try {
        baseProps.page_url = window.location.href;
        baseProps.referrer = document.referrer || "";
        if (typeof navigator !== "undefined") {
          baseProps.user_agent = navigator.userAgent || "";
        }
      } catch {
        // Use defaults
      }
    }

    return baseProps;
  }

  private updateActivity(): void {
    this.lastActivityTime = Date.now();
    this.interactionCount++;
  }

  private canTrack(): boolean {
    return typeof window !== "undefined" && this.isInitialized;
  }

  // Public tracking methods
  trackAuth(
    event: AuthEvent,
    properties: Partial<AuthEventProperties> = {}
  ): void {
    if (!this.canTrack()) return;

    const authProperties: AuthEventProperties = {
      ...this.getBaseProperties(),
      ...properties,
    };

    safePostHogCapture(`${EventCategory.AUTH}_${event}`, authProperties);
    this.updateActivity();
  }

  trackForm(event: FormEvent, properties: Partial<FormEventProperties>): void {
    if (!this.canTrack()) return;

    const formProperties: FormEventProperties = {
      ...this.getBaseProperties(),
      form_name: properties.form_name || "unknown",
      ...properties,
    };

    safePostHogCapture(`${EventCategory.FORM}_${event}`, formProperties);
    this.updateActivity();
  }

  trackSession(
    event: SessionEvent,
    properties: Partial<SessionEventProperties> = {}
  ): void {
    if (!this.canTrack()) return;

    const sessionProperties: SessionEventProperties = {
      ...this.getBaseProperties(),
      session_duration: Date.now() - this.sessionStartTime,
      pages_visited: this.pageViewCount,
      interactions_count: this.interactionCount,
      last_activity: new Date(this.lastActivityTime).toISOString(),
      ...properties,
    };

    safePostHogCapture(`${EventCategory.SESSION}_${event}`, sessionProperties);
  }

  private trackSessionHeartbeat(): void {
    this.trackSession(SessionEvent.SESSION_HEARTBEAT);
  }

  trackError(
    event: ErrorEvent,
    properties: Partial<ErrorEventProperties>
  ): void {
    if (!this.canTrack()) return;

    const errorProperties: ErrorEventProperties = {
      ...this.getBaseProperties(),
      error_message: properties.error_message || "Unknown error",
      ...properties,
    };

    safePostHogCapture(`${EventCategory.ERROR}_${event}`, errorProperties);
    this.updateActivity();
  }

  trackInteraction(
    event: InteractionEvent,
    properties: Partial<InteractionEventProperties>
  ): void {
    if (!this.canTrack()) return;

    const interactionProperties: InteractionEventProperties = {
      ...this.getBaseProperties(),
      element_type: properties.element_type || "unknown",
      ...properties,
    };

    safePostHogCapture(
      `${EventCategory.USER_INTERACTION}_${event}`,
      interactionProperties
    );
    this.updateActivity();
  }

  trackNavigation(
    event: NavigationEvent,
    properties: Partial<NavigationEventProperties>
  ): void {
    if (!this.canTrack()) return;

    const navigationProperties: NavigationEventProperties = {
      ...this.getBaseProperties(),
      to_page:
        properties.to_page ||
        (typeof window !== "undefined" ? window.location.pathname : ""),
      ...properties,
    };

    safePostHogCapture(
      `${EventCategory.NAVIGATION}_${event}`,
      navigationProperties
    );
    this.updateActivity();

    if (event === NavigationEvent.PAGE_VISITED) {
      this.pageViewCount++;
    }
  }

  // Utility methods
  trackButtonClick(
    buttonText: string,
    buttonId?: string,
    context?: string
  ): void {
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
  ): void {
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
  ): void {
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
  ): void {
    this.trackError(ErrorEvent.API_ERROR, {
      error_message: errorMessage,
      api_endpoint: endpoint,
      http_status: statusCode,
      retry_count: retryCount,
    });
  }

  trackJavaScriptError(error: Error, source?: string): void {
    this.trackError(ErrorEvent.JAVASCRIPT_ERROR, {
      error_message: error.message,
      error_stack: error.stack,
      error_source: source,
    });
  }

  identifyUser(userId: string, userProperties: Record<string, any> = {}): void {
    if (!this.canTrack()) return;

    safePostHogIdentify(userId, {
      ...userProperties,
      first_seen: new Date().toISOString(),
    });

    safeSetItem("localStorage", "user_has_visited", "true");
  }

  endSession(): void {
    if (!this.canTrack()) return;

    this.trackSession(SessionEvent.SESSION_ENDED, {
      session_duration: Date.now() - this.sessionStartTime,
      pages_visited: this.pageViewCount,
      interactions_count: this.interactionCount,
    });

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStartTime,
      pageViews: this.pageViewCount,
      interactions: this.interactionCount,
      lastActivity: this.lastActivityTime,
      isInitialized: this.isInitialized,
    };
  }

  reset(): void {
    if (typeof window !== "undefined") {
      this.sessionId = this.getOrCreateSessionId();
      this.sessionStartTime = Date.now();
      this.lastActivityTime = Date.now();
      this.pageViewCount = 0;
      this.interactionCount = 0;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.canTrack();
  }
}

// Create singleton instance but don't initialize
export const tracker = new PostHogTracker();

// Safe error tracking
export const trackUnhandledError = (error: Error, errorInfo?: any): void => {
  tracker.trackJavaScriptError(error, "unhandled_error");
};

// Setup global error handlers only in browser
if (typeof window !== "undefined") {
  // Wait for DOM to be ready
  const setupErrorHandlers = () => {
    window.addEventListener("error", (event) => {
      tracker.trackJavaScriptError(
        new Error(event.message),
        event.filename || "unknown"
      );
    });

    window.addEventListener("unhandledrejection", (event) => {
      tracker.trackJavaScriptError(
        new Error(String(event.reason)),
        "unhandled_promise_rejection"
      );
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupErrorHandlers);
  } else {
    setupErrorHandlers();
  }
}
