import { useCallback, useEffect, useRef } from "react";
import {
  FormEvent,
  InteractionEvent,
  AuthEvent,
  NavigationEvent,
} from "./events";

// Safe tracking functions
const safeTrackForm = (event: FormEvent, properties: any): void => {
  if (typeof window === "undefined") return;

  try {
    import("./tracker")
      .then(({ tracker }) => {
        tracker.trackForm(event, properties);
      })
      .catch(() => {
        // Silently fail if tracker not available
      });
  } catch {
    // Silently fail
  }
};

const safeTrackInteraction = (
  event: InteractionEvent,
  properties: any
): void => {
  if (typeof window === "undefined") return;

  try {
    import("./tracker")
      .then(({ tracker }) => {
        tracker.trackInteraction(event, properties);
      })
      .catch(() => {
        // Silently fail if tracker not available
      });
  } catch {
    // Silently fail
  }
};

const safeTrackAuth = (event: AuthEvent, properties: any): void => {
  if (typeof window === "undefined") return;

  try {
    import("./tracker")
      .then(({ tracker }) => {
        tracker.trackAuth(event, properties);
      })
      .catch(() => {
        // Silently fail if tracker not available
      });
  } catch {
    // Silently fail
  }
};

const safeTrackNavigation = (event: NavigationEvent, properties: any): void => {
  if (typeof window === "undefined") return;

  try {
    import("./tracker")
      .then(({ tracker }) => {
        tracker.trackNavigation(event, properties);
      })
      .catch(() => {
        // Silently fail if tracker not available
      });
  } catch {
    // Silently fail
  }
};

const safeTrackError = (type: string, message: string, context: any): void => {
  if (typeof window === "undefined") return;

  try {
    import("./errors")
      .then(({ errorTracker }) => {
        switch (type) {
          case "api":
            errorTracker.trackAPIError(
              context.endpoint || "",
              message,
              context.statusCode,
              context
            );
            break;
          case "validation":
            errorTracker.trackValidationError(
              context.formName || "",
              context.fieldName || "",
              message,
              context
            );
            break;
          case "javascript":
            errorTracker.trackJavaScriptError(new Error(message), context);
            break;
          case "network":
            errorTracker.trackNetworkError(
              context.endpoint || "",
              message,
              context
            );
            break;
          case "auth":
            errorTracker.trackAuthenticationError(
              context.method || "",
              message,
              context
            );
            break;
          case "system":
            errorTracker.trackSystemError(
              message,
              context.component || "",
              context
            );
            break;
        }
      })
      .catch(() => {
        // Silently fail if error tracker not available
      });
  } catch {
    // Silently fail
  }
};

// Main tracking hook with commonly used methods
export function useTracking() {
  const formStartTimeRef = useRef<number>(Date.now());

  // Form tracking methods
  const trackFormStart = useCallback((formName: string, step?: number) => {
    formStartTimeRef.current = Date.now();
    safeTrackForm(FormEvent.FORM_STARTED, {
      form_name: formName,
      form_step: step,
    });
  }, []);

  const trackFormSubmit = useCallback(
    (formName: string, step?: number, additionalProps?: any) => {
      safeTrackForm(FormEvent.FORM_SUBMITTED, {
        form_name: formName,
        form_duration: Date.now() - formStartTimeRef.current,
        form_step: step,
        ...additionalProps,
      });
    },
    []
  );

  const trackFormError = useCallback(
    (
      formName: string,
      fieldName: string,
      errorMessage: string,
      step?: number
    ) => {
      safeTrackForm(FormEvent.FIELD_ERROR, {
        form_name: formName,
        field_name: fieldName,
        error_message: errorMessage,
        form_step: step,
      });
    },
    []
  );

  const trackFormValidationErrors = useCallback(
    (formName: string, validationErrors: string[], step?: number) => {
      safeTrackForm(FormEvent.FORM_VALIDATION_ERROR, {
        form_name: formName,
        validation_errors: validationErrors,
        form_step: step,
      });
    },
    []
  );

  const trackFieldFocus = useCallback(
    (formName: string, fieldName: string, step?: number) => {
      safeTrackForm(FormEvent.FIELD_FOCUSED, {
        form_name: formName,
        field_name: fieldName,
        form_step: step,
      });
    },
    []
  );

  const trackFieldBlur = useCallback(
    (formName: string, fieldName: string, step?: number) => {
      safeTrackForm(FormEvent.FIELD_BLURRED, {
        form_name: formName,
        field_name: fieldName,
        form_step: step,
      });
    },
    []
  );

  // Interaction tracking methods
  const trackButtonClick = useCallback(
    (buttonText: string, context?: string, buttonId?: string) => {
      safeTrackInteraction(InteractionEvent.BUTTON_CLICK, {
        element_type: "button",
        element_text: buttonText,
        element_id: buttonId,
        interaction_context: context,
      });
    },
    []
  );

  const trackLinkClick = useCallback(
    (linkText: string, href: string, context?: string) => {
      safeTrackInteraction(InteractionEvent.LINK_CLICK, {
        element_type: "link",
        element_text: linkText,
        interaction_context: context,
      });
    },
    []
  );

  const trackModalOpen = useCallback((modalName: string, context?: string) => {
    safeTrackInteraction(InteractionEvent.MODAL_OPENED, {
      element_type: "modal",
      element_text: modalName,
      interaction_context: context,
    });
  }, []);

  const trackModalClose = useCallback((modalName: string, context?: string) => {
    safeTrackInteraction(InteractionEvent.MODAL_CLOSED, {
      element_type: "modal",
      element_text: modalName,
      interaction_context: context,
    });
  }, []);

  const trackDropdownOpen = useCallback(
    (dropdownName: string, context?: string) => {
      safeTrackInteraction(InteractionEvent.DROPDOWN_OPENED, {
        element_type: "dropdown",
        element_text: dropdownName,
        interaction_context: context,
      });
    },
    []
  );

  const trackSearch = useCallback((searchTerm: string, context?: string) => {
    safeTrackInteraction(InteractionEvent.SEARCH_PERFORMED, {
      element_type: "search",
      element_text: searchTerm,
      interaction_context: context,
    });
  }, []);

  // Navigation tracking
  const trackPageVisit = useCallback((page: string, fromPage?: string) => {
    safeTrackNavigation(NavigationEvent.PAGE_VISITED, {
      to_page: page,
      from_page: fromPage,
    });
  }, []);

  // Auth tracking
  const trackAuthStart = useCallback(
    (method: "email" | "google" | "password_reset") => {
      switch (method) {
        case "email":
          safeTrackAuth(AuthEvent.LOGIN_STARTED, { auth_method: method });
          break;
        case "google":
          safeTrackAuth(AuthEvent.GOOGLE_AUTH_STARTED, { auth_method: method });
          break;
        case "password_reset":
          safeTrackAuth(AuthEvent.PASSWORD_RESET_REQUESTED, {
            auth_method: method,
          });
          break;
      }
    },
    []
  );

  const trackAuthSuccess = useCallback(
    (method: "email" | "google" | "password_reset") => {
      switch (method) {
        case "email":
          safeTrackAuth(AuthEvent.LOGIN_COMPLETED, { auth_method: method });
          break;
        case "google":
          safeTrackAuth(AuthEvent.GOOGLE_AUTH_COMPLETED, {
            auth_method: method,
          });
          break;
        case "password_reset":
          safeTrackAuth(AuthEvent.PASSWORD_RESET_COMPLETED, {
            auth_method: method,
          });
          break;
      }
    },
    []
  );

  const trackAuthFailure = useCallback(
    (method: "email" | "google" | "password_reset", errorMessage: string) => {
      switch (method) {
        case "email":
          safeTrackAuth(AuthEvent.LOGIN_FAILED, {
            auth_method: method,
            error_message: errorMessage,
          });
          break;
        case "google":
          safeTrackAuth(AuthEvent.GOOGLE_AUTH_FAILED, {
            auth_method: method,
            error_message: errorMessage,
          });
          break;
      }
    },
    []
  );

  return {
    // Form tracking
    trackFormStart,
    trackFormSubmit,
    trackFormError,
    trackFormValidationErrors,
    trackFieldFocus,
    trackFieldBlur,

    // Interaction tracking
    trackButtonClick,
    trackLinkClick,
    trackModalOpen,
    trackModalClose,
    trackDropdownOpen,
    trackSearch,

    // Navigation tracking
    trackPageVisit,

    // Auth tracking
    trackAuthStart,
    trackAuthSuccess,
    trackAuthFailure,
  };
}

// Error tracking hook
export function useErrorTracking() {
  const trackAPIError = useCallback(
    (
      endpoint: string,
      errorMessage: string,
      statusCode?: number,
      userId?: string,
      retryCount?: number
    ) => {
      safeTrackError("api", errorMessage, {
        endpoint,
        statusCode,
        userId,
        retry_count: retryCount,
      });
    },
    []
  );

  const trackValidationError = useCallback(
    (
      formName: string,
      fieldName: string,
      errorMessage: string,
      userId?: string
    ) => {
      safeTrackError("validation", errorMessage, {
        formName,
        fieldName,
        userId,
      });
    },
    []
  );

  const trackJavaScriptError = useCallback(
    (error: Error, component?: string, userId?: string) => {
      safeTrackError("javascript", error.message, {
        component,
        userId,
        stack: error.stack,
      });
    },
    []
  );

  const trackNetworkError = useCallback(
    (endpoint: string, errorMessage: string, userId?: string) => {
      safeTrackError("network", errorMessage, {
        endpoint,
        userId,
      });
    },
    []
  );

  const trackAuthError = useCallback(
    (method: string, errorMessage: string, userId?: string) => {
      safeTrackError("auth", errorMessage, {
        method,
        userId,
      });
    },
    []
  );

  const trackSystemError = useCallback(
    (errorMessage: string, component: string, userId?: string) => {
      safeTrackError("system", errorMessage, {
        component,
        userId,
      });
    },
    []
  );

  // Get error analytics data
  const getErrorSummary = useCallback(async () => {
    if (typeof window === "undefined") return null;

    try {
      const { errorTracker } = await import("./errors");
      return errorTracker.exportErrorData();
    } catch {
      return null;
    }
  }, []);

  const getTopErrors = useCallback(async (limit: number = 10) => {
    if (typeof window === "undefined") return [];

    try {
      const { errorTracker } = await import("./errors");
      return errorTracker.getTopErrors(limit);
    } catch {
      return [];
    }
  }, []);

  const getCriticalErrors = useCallback(async () => {
    if (typeof window === "undefined") return [];

    try {
      const { errorTracker } = await import("./errors");
      return errorTracker.getCriticalErrors();
    } catch {
      return [];
    }
  }, []);

  return {
    // Error tracking methods
    trackAPIError,
    trackValidationError,
    trackJavaScriptError,
    trackNetworkError,
    trackAuthError,
    trackSystemError,

    // Error analytics
    getErrorSummary,
    getTopErrors,
    getCriticalErrors,
  };
}

// Session tracking hook
export function useSessionTracking() {
  const extendSession = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const { sessionManager } = await import("./session");
      sessionManager.extendSession();
    } catch {
      // Silently fail
    }
  }, []);

  const endSession = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const { sessionManager } = await import("./session");
      sessionManager.endSession();
    } catch {
      // Silently fail
    }
  }, []);

  const updateActivity = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const { sessionManager } = await import("./session");
      sessionManager.updateActivity();
    } catch {
      // Silently fail
    }
  }, []);

  const setUser = useCallback(async (userId: string, userEmail?: string) => {
    if (typeof window === "undefined") return;

    try {
      const { sessionManager } = await import("./session");
      sessionManager.setUser(userId, userEmail);
    } catch {
      // Silently fail
    }
  }, []);

  const clearUser = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const { sessionManager } = await import("./session");
      sessionManager.clearUser();
    } catch {
      // Silently fail
    }
  }, []);

  const getSessionData = useCallback(async () => {
    if (typeof window === "undefined") return null;

    try {
      const { sessionManager } = await import("./session");
      return sessionManager.getSessionData();
    } catch {
      return null;
    }
  }, []);

  const getSessionSummary = useCallback(async () => {
    if (typeof window === "undefined") return null;

    try {
      const { sessionManager } = await import("./session");
      return sessionManager.getSessionSummary();
    } catch {
      return null;
    }
  }, []);

  const isSessionActive = useCallback(async () => {
    if (typeof window === "undefined") return false;

    try {
      const { sessionManager } = await import("./session");
      return sessionManager.isSessionActive();
    } catch {
      return false;
    }
  }, []);

  const getSessionDuration = useCallback(async () => {
    if (typeof window === "undefined") return 0;

    try {
      const { sessionManager } = await import("./session");
      return sessionManager.getSessionDuration();
    } catch {
      return 0;
    }
  }, []);

  return {
    extendSession,
    endSession,
    updateActivity,
    setUser,
    clearUser,
    getSessionData,
    getSessionSummary,
    isSessionActive,
    getSessionDuration,
  };
}

// Hook for tracking component lifecycle
export function useComponentTracking(componentName: string) {
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track component mount
    safeTrackInteraction(InteractionEvent.BUTTON_CLICK, {
      element_type: "component",
      element_text: `${componentName}_mounted`,
      interaction_context: "component_lifecycle",
    });

    mountTimeRef.current = Date.now();

    // Track component unmount
    return () => {
      safeTrackInteraction(InteractionEvent.BUTTON_CLICK, {
        element_type: "component",
        element_text: `${componentName}_unmounted`,
        interaction_context: "component_lifecycle",
      });
    };
  }, [componentName]);

  const trackComponentInteraction = useCallback(
    (interactionType: string, details?: Record<string, any>) => {
      safeTrackInteraction(InteractionEvent.BUTTON_CLICK, {
        element_type: "component",
        element_text: `${componentName}_${interactionType}`,
        interaction_context: "component_interaction",
        ...details,
      });
    },
    [componentName]
  );

  return {
    trackComponentInteraction,
  };
}

// Hook for tracking form lifecycle with validation
export function useFormTracking(formName: string) {
  const formStartTimeRef = useRef<number>(Date.now());
  const fieldInteractionsRef = useRef<Record<string, number>>({});
  const validationErrorsRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track form initialization
    safeTrackForm(FormEvent.FORM_STARTED, {
      form_name: formName,
    });

    formStartTimeRef.current = Date.now();
    fieldInteractionsRef.current = {};
    validationErrorsRef.current = [];

    return () => {
      // Track form abandonment if not submitted
      safeTrackForm(FormEvent.FORM_VALIDATION_ERROR, {
        form_name: formName,
        form_duration: Date.now() - formStartTimeRef.current,
        error_message: "Form abandoned",
      });
    };
  }, [formName]);

  const trackFieldInteraction = useCallback(
    (fieldName: string, interactionType: "focus" | "blur" | "change") => {
      fieldInteractionsRef.current[fieldName] =
        (fieldInteractionsRef.current[fieldName] || 0) + 1;

      const event =
        interactionType === "focus"
          ? FormEvent.FIELD_FOCUSED
          : FormEvent.FIELD_BLURRED;
      safeTrackForm(event, {
        form_name: formName,
        field_name: fieldName,
      });
    },
    [formName]
  );

  const trackFieldError = useCallback(
    (fieldName: string, errorMessage: string) => {
      validationErrorsRef.current.push(`${fieldName}: ${errorMessage}`);

      safeTrackForm(FormEvent.FIELD_ERROR, {
        form_name: formName,
        field_name: fieldName,
        error_message: errorMessage,
      });
    },
    [formName]
  );

  const trackFormSubmission = useCallback(
    (
      success: boolean,
      errorMessage?: string,
      additionalData?: Record<string, any>
    ) => {
      const formDuration = Date.now() - formStartTimeRef.current;
      const totalFieldInteractions = Object.values(
        fieldInteractionsRef.current
      ).reduce((sum, count) => sum + count, 0);

      if (success) {
        safeTrackForm(FormEvent.FORM_SUBMITTED, {
          form_name: formName,
          form_duration: formDuration,
          field_interactions_count: totalFieldInteractions,
          ...additionalData,
        });
      } else {
        safeTrackForm(FormEvent.FORM_VALIDATION_ERROR, {
          form_name: formName,
          form_duration: formDuration,
          validation_errors: validationErrorsRef.current,
          error_message: errorMessage,
          field_interactions_count: totalFieldInteractions,
          ...additionalData,
        });
      }
    },
    [formName]
  );

  const getFormAnalytics = useCallback(() => {
    return {
      formName,
      duration: Date.now() - formStartTimeRef.current,
      fieldInteractions: { ...fieldInteractionsRef.current },
      validationErrors: [...validationErrorsRef.current],
      totalInteractions: Object.values(fieldInteractionsRef.current).reduce(
        (sum, count) => sum + count,
        0
      ),
    };
  }, [formName]);

  return {
    trackFieldInteraction,
    trackFieldError,
    trackFormSubmission,
    getFormAnalytics,
  };
}
