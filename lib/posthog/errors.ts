import { tracker } from "./tracker";
import { ErrorEvent } from "./events";

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
  private readonly MAX_ERROR_CONTEXTS = 10; // Limit contexts stored per error type
  private readonly STORAGE_KEY = "yadn_error_tracking";

  constructor() {
    this.loadErrorCounts();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupGlobalErrorHandlers() {
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
  }

  private loadErrorCounts() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.errorCounts = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn("Failed to load error counts:", error);
    }
  }

  private saveErrorCounts() {
    try {
      const data = Object.fromEntries(this.errorCounts);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save error counts:", error);
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
  ) {
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

  // Public methods for different error types
  trackAPIError(
    endpoint: string,
    errorMessage: string,
    statusCode?: number,
    context: Partial<ErrorContext> = {}
  ) {
    const errorContext: ErrorContext = {
      ...context,
      apiEndpoint: endpoint,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(errorMessage, `api_${statusCode}`);
    this.updateRecurrentError(
      errorKey,
      errorMessage,
      `api_${statusCode}`,
      errorContext
    );

    tracker.trackError(ErrorEvent.API_ERROR, {
      error_message: errorMessage,
      api_endpoint: endpoint,
      http_status: statusCode,
      error_code: `api_${statusCode}`,
    });
  }

  trackValidationError(
    formName: string,
    fieldName: string,
    errorMessage: string,
    context: Partial<ErrorContext> = {}
  ) {
    const errorContext: ErrorContext = {
      ...context,
      component: formName,
      action: `validation_${fieldName}`,
      page: window.location.pathname,
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

    tracker.trackError(ErrorEvent.VALIDATION_ERROR, {
      error_message: errorMessage,
      error_code: `validation_${formName}`,
      error_source: fieldName,
    });
  }

  trackAuthenticationError(
    authMethod: string,
    errorMessage: string,
    context: Partial<ErrorContext> = {}
  ) {
    const errorContext: ErrorContext = {
      ...context,
      action: `auth_${authMethod}`,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(errorMessage, `auth_${authMethod}`);
    this.updateRecurrentError(
      errorKey,
      errorMessage,
      `auth_${authMethod}`,
      errorContext
    );

    tracker.trackError(ErrorEvent.AUTHENTICATION_ERROR, {
      error_message: errorMessage,
      error_code: `auth_${authMethod}`,
    });
  }

  trackNetworkError(
    endpoint: string,
    errorMessage: string,
    context: Partial<ErrorContext> = {}
  ) {
    const errorContext: ErrorContext = {
      ...context,
      apiEndpoint: endpoint,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(errorMessage, "network");
    this.updateRecurrentError(errorKey, errorMessage, "network", errorContext);

    tracker.trackError(ErrorEvent.NETWORK_ERROR, {
      error_message: errorMessage,
      api_endpoint: endpoint,
      error_code: "network",
    });
  }

  trackJavaScriptError(
    error: Error,
    context: Partial<ErrorContext> = {},
    filename?: string,
    lineNumber?: number
  ) {
    const errorContext: ErrorContext = {
      ...context,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(error.message, "javascript");
    this.updateRecurrentError(
      errorKey,
      error.message,
      "javascript",
      errorContext
    );

    tracker.trackError(ErrorEvent.JAVASCRIPT_ERROR, {
      error_message: error.message,
      error_stack: error.stack,
      error_source: filename || context.component || "unknown",
      error_code: "javascript",
    });
  }

  trackSystemError(
    errorMessage: string,
    component: string,
    context: Partial<ErrorContext> = {}
  ) {
    const errorContext: ErrorContext = {
      ...context,
      component,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    const errorKey = this.generateErrorKey(errorMessage, `system_${component}`);
    this.updateRecurrentError(
      errorKey,
      errorMessage,
      `system_${component}`,
      errorContext
    );

    tracker.trackError(ErrorEvent.SYSTEM_ERROR, {
      error_message: errorMessage,
      error_source: component,
      error_code: `system_${component}`,
    });
  }

  // Methods for retrieving error data for admin dashboard
  getRecurrentErrors(): RecurrentError[] {
    return Array.from(this.errorCounts.values()).sort(
      (a, b) => b.count - a.count
    ); // Sort by frequency
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
    // Define critical errors as those affecting multiple users or occurring frequently
    return this.getRecurrentErrors().filter(
      (error) => error.count >= 5 || error.affectedUsers.length > 1
    );
  }

  clearErrorCounts() {
    this.errorCounts.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Method to export error data for admin dashboard
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
) => {
  errorTracker.trackValidationError(formName, fieldName, errorMessage, {
    userId,
  });
};

export const trackAPIError = (
  endpoint: string,
  errorMessage: string,
  statusCode?: number,
  userId?: string
) => {
  errorTracker.trackAPIError(endpoint, errorMessage, statusCode, { userId });
};

export const trackAuthError = (
  method: string,
  errorMessage: string,
  userId?: string
) => {
  errorTracker.trackAuthenticationError(method, errorMessage, { userId });
};
