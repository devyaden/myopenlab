import { ErrorEvent } from "./events";

// Safe browser API access
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

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  page?: string;
  component?: string;
  action?: string;
  formData?: Record<string, any>;
  apiEndpoint?: string;
  timestamp?: string;
}

export interface RecurrentError {
  errorMessage: string;
  errorCode?: string;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  affectedUsers: string[];
  contexts: ErrorContext[];
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errorCounts: Map<string, RecurrentError> = new Map();
  private readonly MAX_ERROR_CONTEXTS = 10;
  private readonly STORAGE_KEY = "yadn_error_tracking";
  private isInitialized: boolean = false;

  constructor() {
    // Don't access localStorage during construction
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  initializeInBrowser(): void {
    if (typeof window === "undefined" || this.isInitialized) return;

    this.loadErrorCounts();
    this.setupGlobalErrorHandlers();
    this.isInitialized = true;
  }

  private loadErrorCounts(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = safeGetItem("localStorage", this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.errorCounts = new Map(Object.entries(data));
      }
    } catch {
      // Silently fail
    }
  }

  private saveErrorCounts(): void {
    if (typeof window === "undefined") return;

    try {
      const data = Object.fromEntries(this.errorCounts);
      safeSetItem("localStorage", this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Silently fail
    }
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === "undefined") return;

    try {
      // Handle JavaScript errors
      window.addEventListener("error", (event) => {
        this.trackJavaScriptError(
          new Error(event.message),
          {
            page: window.location.pathname,
            component: "global_error_handler",
          },
          event.filename,
          event.lineno
        );
      });

      // Handle unhandled promise rejections
      window.addEventListener("unhandledrejection", (event) => {
        this.trackJavaScriptError(
          new Error(`Unhandled Promise Rejection: ${event.reason}`),
          {
            page: window.location.pathname,
            component: "promise_rejection_handler",
          }
        );
      });
    } catch {
      // Silently fail
    }
  }

  private generateErrorKey(errorMessage: string, errorCode?: string): string {
    return `${errorCode || "unknown"}_${errorMessage.slice(0, 100)}`;
  }

  private updateRecurrentError(
    errorKey: string,
    errorMessage: string,
    errorCode: string | undefined,
    context: ErrorContext
  ): void {
    const now = new Date().toISOString();

    if (this.errorCounts.has(errorKey)) {
      const existing = this.errorCounts.get(errorKey)!;
      existing.count++;
      existing.lastOccurrence = now;

      // Add user to affected users if not already present
      if (context.userId && !existing.affectedUsers.includes(context.userId)) {
        existing.affectedUsers.push(context.userId);
      }

      // Add context, keeping only the most recent ones
      existing.contexts.push(context);
      if (existing.contexts.length > this.MAX_ERROR_CONTEXTS) {
        existing.contexts = existing.contexts.slice(-this.MAX_ERROR_CONTEXTS);
      }
    } else {
      this.errorCounts.set(errorKey, {
        errorMessage,
        errorCode,
        count: 1,
        firstOccurrence: now,
        lastOccurrence: now,
        affectedUsers: context.userId ? [context.userId] : [],
        contexts: [context],
      });
    }

    this.saveErrorCounts();
  }

  private safeTrackError(
    errorEvent: ErrorEvent,
    errorMessage: string,
    errorCode?: string,
    additionalProperties: Record<string, any> = {}
  ): void {
    if (typeof window === "undefined") return;

    try {
      import("./tracker")
        .then(({ tracker }) => {
          tracker.trackError(errorEvent, {
            error_message: errorMessage,
            error_code: errorCode,
            ...additionalProperties,
          });
        })
        .catch(() => {
          // Silently fail if tracker not available
        });
    } catch {
      // Silently fail
    }
  }

  // Public methods for different error types
  trackAPIError(
    endpoint: string,
    errorMessage: string,
    statusCode?: number,
    context: Partial<ErrorContext> = {}
  ): void {
    const errorContext: ErrorContext = {
      ...context,
      apiEndpoint: endpoint,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(errorMessage, `api_${statusCode}`);
    this.updateRecurrentError(
      errorKey,
      errorMessage,
      `api_${statusCode}`,
      errorContext
    );

    this.safeTrackError(
      ErrorEvent.API_ERROR,
      errorMessage,
      `api_${statusCode}`,
      {
        api_endpoint: endpoint,
        http_status: statusCode,
      }
    );
  }

  trackValidationError(
    formName: string,
    fieldName: string,
    errorMessage: string,
    context: Partial<ErrorContext> = {}
  ): void {
    const errorContext: ErrorContext = {
      ...context,
      component: formName,
      action: `validation_${fieldName}`,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(
      errorMessage,
      `validation_${formName}`
    );
    this.updateRecurrentError(
      errorKey,
      errorMessage,
      `validation_${formName}`,
      errorContext
    );

    this.safeTrackError(
      ErrorEvent.VALIDATION_ERROR,
      errorMessage,
      `validation_${formName}`,
      {
        error_source: fieldName,
      }
    );
  }

  trackAuthenticationError(
    authMethod: string,
    errorMessage: string,
    context: Partial<ErrorContext> = {}
  ): void {
    const errorContext: ErrorContext = {
      ...context,
      action: `auth_${authMethod}`,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(errorMessage, `auth_${authMethod}`);
    this.updateRecurrentError(
      errorKey,
      errorMessage,
      `auth_${authMethod}`,
      errorContext
    );

    this.safeTrackError(
      ErrorEvent.AUTHENTICATION_ERROR,
      errorMessage,
      `auth_${authMethod}`
    );
  }

  trackNetworkError(
    endpoint: string,
    errorMessage: string,
    context: Partial<ErrorContext> = {}
  ): void {
    const errorContext: ErrorContext = {
      ...context,
      apiEndpoint: endpoint,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(errorMessage, "network");
    this.updateRecurrentError(errorKey, errorMessage, "network", errorContext);

    this.safeTrackError(ErrorEvent.NETWORK_ERROR, errorMessage, "network", {
      api_endpoint: endpoint,
    });
  }

  trackJavaScriptError(
    error: Error,
    context: Partial<ErrorContext> = {},
    filename?: string,
    lineNumber?: number
  ): void {
    const errorContext: ErrorContext = {
      ...context,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(error.message, "javascript");
    this.updateRecurrentError(
      errorKey,
      error.message,
      "javascript",
      errorContext
    );

    this.safeTrackError(
      ErrorEvent.JAVASCRIPT_ERROR,
      error.message,
      "javascript",
      {
        error_stack: error.stack,
        error_source: filename || context.component || "unknown",
      }
    );
  }

  trackSystemError(
    errorMessage: string,
    component: string,
    context: Partial<ErrorContext> = {}
  ): void {
    const errorContext: ErrorContext = {
      ...context,
      component,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(errorMessage, `system_${component}`);
    this.updateRecurrentError(
      errorKey,
      errorMessage,
      `system_${component}`,
      errorContext
    );

    this.safeTrackError(
      ErrorEvent.SYSTEM_ERROR,
      errorMessage,
      `system_${component}`,
      {
        error_source: component,
      }
    );
  }

  // Methods for retrieving error data for admin dashboard
  getRecurrentErrors(): RecurrentError[] {
    return Array.from(this.errorCounts.values()).sort(
      (a, b) => b.count - a.count
    );
  }

  getErrorsByTimeRange(startDate: Date, endDate: Date): RecurrentError[] {
    return this.getRecurrentErrors().filter((error) => {
      const lastOccurrence = new Date(error.lastOccurrence);
      return lastOccurrence >= startDate && lastOccurrence <= endDate;
    });
  }

  getTopErrors(limit: number = 10): RecurrentError[] {
    return this.getRecurrentErrors().slice(0, limit);
  }

  getErrorsAffectingMultipleUsers(): RecurrentError[] {
    return this.getRecurrentErrors().filter(
      (error) => error.affectedUsers.length > 1
    );
  }

  getCriticalErrors(): RecurrentError[] {
    return this.getRecurrentErrors().filter(
      (error) => error.count >= 5 || error.affectedUsers.length > 1
    );
  }

  clearErrorCounts(): void {
    this.errorCounts.clear();
    safeRemoveItem("localStorage", this.STORAGE_KEY);
  }

  exportErrorData() {
    return {
      recurrentErrors: this.getRecurrentErrors(),
      criticalErrors: this.getCriticalErrors(),
      multiUserErrors: this.getErrorsAffectingMultipleUsers(),
      summary: {
        totalUniqueErrors: this.errorCounts.size,
        totalErrorOccurrences: Array.from(this.errorCounts.values()).reduce(
          (sum, error) => sum + error.count,
          0
        ),
        totalAffectedUsers: new Set(
          Array.from(this.errorCounts.values()).flatMap(
            (error) => error.affectedUsers
          )
        ).size,
      },
    };
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();

// Utility functions for common error scenarios
export const trackFormError = (
  formName: string,
  fieldName: string,
  errorMessage: string,
  userId?: string
): void => {
  errorTracker.trackValidationError(formName, fieldName, errorMessage, {
    userId,
  });
};

export const trackAPIError = (
  endpoint: string,
  errorMessage: string,
  statusCode?: number,
  userId?: string
): void => {
  errorTracker.trackAPIError(endpoint, errorMessage, statusCode, { userId });
};

export const trackAuthError = (
  method: string,
  errorMessage: string,
  userId?: string
): void => {
  errorTracker.trackAuthenticationError(method, errorMessage, { userId });
};
