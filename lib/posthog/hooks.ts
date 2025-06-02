import { useCallback, useEffect, useRef } from "react";
import { errorTracker } from "./errors";
import {
  AuthEvent,
  FormEvent,
  InteractionEvent,
  NavigationEvent,
} from "./events";
import { sessionManager } from "./session";
import { tracker } from "./tracker";

// Main tracking hook with commonly used methods
export function useTracking() {
  const formStartTimeRef = useRef<number>(Date.now());

  // Form tracking methods
  const trackFormStart = useCallback((formName: string, step?: number) => {
    formStartTimeRef.current = Date.now();
    tracker.trackForm(FormEvent.FORM_STARTED, {
      form_name: formName,
      form_step: step,
    });
  }, []);

  const trackFormSubmit = useCallback(
    (formName: string, step?: number, additionalProps?: any) => {
      tracker.trackForm(FormEvent.FORM_SUBMITTED, {
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
      tracker.trackForm(FormEvent.FIELD_ERROR, {
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
      tracker.trackForm(FormEvent.FORM_VALIDATION_ERROR, {
        form_name: formName,
        validation_errors: validationErrors,
        form_step: step,
      });
    },
    []
  );

  const trackFieldFocus = useCallback(
    (formName: string, fieldName: string, step?: number) => {
      tracker.trackForm(FormEvent.FIELD_FOCUSED, {
        form_name: formName,
        field_name: fieldName,
        form_step: step,
      });
    },
    []
  );

  const trackFieldBlur = useCallback(
    (formName: string, fieldName: string, step?: number) => {
      tracker.trackForm(FormEvent.FIELD_BLURRED, {
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
      tracker.trackButtonClick(buttonText, buttonId, context);
    },
    []
  );

  const trackLinkClick = useCallback(
    (linkText: string, href: string, context?: string) => {
      tracker.trackInteraction(InteractionEvent.LINK_CLICK, {
        element_type: "link",
        element_text: linkText,
        interaction_context: context,
      });
    },
    []
  );

  const trackModalOpen = useCallback((modalName: string, context?: string) => {
    tracker.trackInteraction(InteractionEvent.MODAL_OPENED, {
      element_type: "modal",
      element_text: modalName,
      interaction_context: context,
    });
  }, []);

  const trackModalClose = useCallback((modalName: string, context?: string) => {
    tracker.trackInteraction(InteractionEvent.MODAL_CLOSED, {
      element_type: "modal",
      element_text: modalName,
      interaction_context: context,
    });
  }, []);

  const trackDropdownOpen = useCallback(
    (dropdownName: string, context?: string) => {
      tracker.trackInteraction(InteractionEvent.DROPDOWN_OPENED, {
        element_type: "dropdown",
        element_text: dropdownName,
        interaction_context: context,
      });
    },
    []
  );

  const trackSearch = useCallback((searchTerm: string, context?: string) => {
    tracker.trackInteraction(InteractionEvent.SEARCH_PERFORMED, {
      element_type: "search",
      element_text: searchTerm,
      interaction_context: context,
    });
  }, []);

  // Navigation tracking
  const trackPageVisit = useCallback((page: string, fromPage?: string) => {
    tracker.trackNavigation(NavigationEvent.PAGE_VISITED, {
      to_page: page,
      from_page: fromPage,
    });
  }, []);

  // Auth tracking
  const trackAuthStart = useCallback(
    (method: "email" | "google" | "password_reset") => {
      switch (method) {
        case "email":
          tracker.trackAuth(AuthEvent.LOGIN_STARTED, { auth_method: method });
          break;
        case "google":
          tracker.trackAuth(AuthEvent.GOOGLE_AUTH_STARTED, {
            auth_method: method,
          });
          break;
        case "password_reset":
          tracker.trackAuth(AuthEvent.PASSWORD_RESET_REQUESTED, {
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
          tracker.trackAuth(AuthEvent.LOGIN_COMPLETED, { auth_method: method });
          break;
        case "google":
          tracker.trackAuth(AuthEvent.GOOGLE_AUTH_COMPLETED, {
            auth_method: method,
          });
          break;
        case "password_reset":
          tracker.trackAuth(AuthEvent.PASSWORD_RESET_COMPLETED, {
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
          tracker.trackAuth(AuthEvent.LOGIN_FAILED, {
            auth_method: method,
            error_message: errorMessage,
          });
          break;
        case "google":
          tracker.trackAuth(AuthEvent.GOOGLE_AUTH_FAILED, {
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
      errorTracker.trackAPIError(endpoint, errorMessage, statusCode, {
        userId,
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
      errorTracker.trackValidationError(formName, fieldName, errorMessage, {
        userId,
      });
    },
    []
  );

  const trackJavaScriptError = useCallback(
    (error: Error, component?: string, userId?: string) => {
      errorTracker.trackJavaScriptError(error, { component, userId });
    },
    []
  );

  const trackNetworkError = useCallback(
    (endpoint: string, errorMessage: string, userId?: string) => {
      errorTracker.trackNetworkError(endpoint, errorMessage, { userId });
    },
    []
  );

  const trackAuthError = useCallback(
    (method: string, errorMessage: string, userId?: string) => {
      errorTracker.trackAuthenticationError(method, errorMessage, { userId });
    },
    []
  );

  const trackSystemError = useCallback(
    (errorMessage: string, component: string, userId?: string) => {
      errorTracker.trackSystemError(errorMessage, component, { userId });
    },
    []
  );

  // Get error analytics data
  const getErrorSummary = useCallback(() => {
    return errorTracker.exportErrorData();
  }, []);

  const getTopErrors = useCallback((limit: number = 10) => {
    return errorTracker.getTopErrors(limit);
  }, []);

  const getCriticalErrors = useCallback(() => {
    return errorTracker.getCriticalErrors();
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
  const extendSession = useCallback(() => {
    sessionManager.extendSession();
  }, []);

  const endSession = useCallback(() => {
    sessionManager.endSession();
  }, []);

  const updateActivity = useCallback(() => {
    sessionManager.updateActivity();
  }, []);

  const setUser = useCallback((userId: string, userEmail?: string) => {
    sessionManager.setUser(userId, userEmail);
  }, []);

  const clearUser = useCallback(() => {
    sessionManager.clearUser();
  }, []);

  const getSessionData = useCallback(() => {
    return sessionManager.getSessionData();
  }, []);

  const getSessionSummary = useCallback(() => {
    return sessionManager.getSessionSummary();
  }, []);

  const isSessionActive = useCallback(() => {
    return sessionManager.isSessionActive();
  }, []);

  const getSessionDuration = useCallback(() => {
    return sessionManager.getSessionDuration();
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
    // Track component mount
    tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
      element_type: "component",
      element_text: `${componentName}_mounted`,
      interaction_context: "component_lifecycle",
    });

    mountTimeRef.current = Date.now();

    // Track component unmount
    return () => {
      const duration = Date.now() - mountTimeRef.current;
      tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
        element_type: "component",
        element_text: `${componentName}_unmounted`,
        interaction_context: "component_lifecycle",
      });
    };
  }, [componentName]);

  const trackComponentInteraction = useCallback(
    (interactionType: string, details?: Record<string, any>) => {
      tracker.trackInteraction(InteractionEvent.BUTTON_CLICK, {
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
    // Track form initialization
    tracker.trackForm(FormEvent.FORM_STARTED, {
      form_name: formName,
    });

    formStartTimeRef.current = Date.now();
    fieldInteractionsRef.current = {};
    validationErrorsRef.current = [];

    return () => {
      // Track form abandonment if not submitted
      tracker.trackForm(FormEvent.FORM_VALIDATION_ERROR, {
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
      tracker.trackForm(event, {
        form_name: formName,
        field_name: fieldName,
      });
    },
    [formName]
  );

  const trackFieldError = useCallback(
    (fieldName: string, errorMessage: string) => {
      validationErrorsRef.current.push(`${fieldName}: ${errorMessage}`);

      tracker.trackForm(FormEvent.FIELD_ERROR, {
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
        tracker.trackForm(FormEvent.FORM_SUBMITTED, {
          form_name: formName,
          form_duration: formDuration,
          field_interactions_count: totalFieldInteractions,
          ...additionalData,
        });
      } else {
        tracker.trackForm(FormEvent.FORM_VALIDATION_ERROR, {
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
