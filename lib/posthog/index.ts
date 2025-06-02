// Main exports for PostHog tracking utilities
export { tracker } from "./tracker";
export { sessionManager } from "./session";
export {
  errorTracker,
  trackFormError,
  trackAPIError,
  trackAuthError,
} from "./errors";

// Export all event types and enums
export {
  EventCategory,
  AuthEvent,
  FormEvent,
  SessionEvent,
  ErrorEvent,
  InteractionEvent,
  NavigationEvent,
} from "./events";

// Export type definitions
export type {
  BaseEventProperties,
  AuthEventProperties,
  FormEventProperties,
  SessionEventProperties,
  ErrorEventProperties,
  InteractionEventProperties,
  NavigationEventProperties,
  EventProperties,
} from "./events";

export type { SessionData } from "./session";
export type { ErrorContext, RecurrentError } from "./errors";

// Re-export hooks
export { useTracking } from "./hooks";
export { useErrorTracking } from "./hooks";
export { useSessionTracking } from "./hooks";
