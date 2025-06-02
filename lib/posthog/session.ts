import { SessionEvent } from "./events";

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

// Safe PostHog reset
const safePostHogReset = (): void => {
  if (typeof window === "undefined") return;

  try {
    import("posthog-js")
      .then((posthogModule) => {
        const posthog = posthogModule.default;
        if (posthog && typeof posthog.reset === "function") {
          posthog.reset();
        }
      })
      .catch(() => {
        // Silently fail if PostHog not available
      });
  } catch {
    // Silently fail
  }
};

// Safe PostHog identify
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

export interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  interactions: number;
  userId?: string;
  userEmail?: string;
  isAuthenticated: boolean;
  currentPage: string;
  entryPage: string;
  referrer: string;
  deviceInfo: {
    type: "mobile" | "tablet" | "desktop";
    userAgent: string;
    screenSize: string;
    viewport: string;
  };
}

class SessionManager {
  private static instance: SessionManager;
  private sessionData: SessionData;
  private activityTimeout: NodeJS.Timeout | null = null;
  private readonly ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly STORAGE_KEY = "yadn_session_data";
  private isInitialized: boolean = false;

  constructor() {
    // Initialize with safe defaults - no browser API access
    this.sessionData = this.getDefaultSessionData();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  initializeInBrowser(): void {
    if (typeof window === "undefined" || this.isInitialized) return;

    this.sessionData = this.initializeSession();
    this.startActivityMonitoring();
    this.setupVisibilityTracking();
    this.isInitialized = true;
  }

  private getDefaultSessionData(): SessionData {
    return {
      sessionId: "",
      startTime: 0,
      lastActivity: 0,
      pageViews: 0,
      interactions: 0,
      isAuthenticated: false,
      currentPage: "",
      entryPage: "",
      referrer: "",
      deviceInfo: {
        type: "desktop",
        userAgent: "",
        screenSize: "",
        viewport: "",
      },
    };
  }

  private initializeSession(): SessionData {
    if (typeof window === "undefined") {
      return this.getDefaultSessionData();
    }

    const existingSession = this.getStoredSession();
    const now = Date.now();

    // Check if existing session is still valid (within timeout)
    if (
      existingSession &&
      now - existingSession.lastActivity < this.ACTIVITY_TIMEOUT
    ) {
      // Resume existing session
      existingSession.lastActivity = now;
      existingSession.currentPage = window.location.pathname;
      this.saveSession(existingSession);
      return existingSession;
    }

    // Create new session
    const newSession: SessionData = {
      sessionId: this.generateSessionId(),
      startTime: now,
      lastActivity: now,
      pageViews: 1,
      interactions: 0,
      isAuthenticated: false,
      currentPage: window.location.pathname,
      entryPage: window.location.pathname,
      referrer: document.referrer || "",
      deviceInfo: this.getDeviceInfo(),
    };

    this.saveSession(newSession);

    // Track new session start safely
    this.trackSessionStart(newSession, existingSession);

    return newSession;
  }

  private trackSessionStart(
    newSession: SessionData,
    existingSession: SessionData | null
  ): void {
    // Safely track session start without importing tracker directly
    if (typeof window !== "undefined") {
      try {
        import("./tracker")
          .then(({ tracker }) => {
            tracker.trackSession(SessionEvent.SESSION_STARTED, {
              session_type: existingSession ? "returning" : "new",
              device_type: newSession.deviceInfo.type,
            });
          })
          .catch(() => {
            // Silently fail if tracker not available
          });
      } catch {
        // Silently fail
      }
    }
  }

  private generateSessionId(): string {
    // Generate UUID without external dependency
    return "yadn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  private getDeviceInfo() {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return {
        type: "desktop" as const,
        userAgent: "",
        screenSize: "",
        viewport: "",
      };
    }

    try {
      const userAgent = navigator.userAgent;
      const screen = window.screen;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
      if (/Mobile|Android|iPhone/.test(userAgent)) {
        deviceType = "mobile";
      } else if (/iPad|Tablet/.test(userAgent)) {
        deviceType = "tablet";
      }

      return {
        type: deviceType,
        userAgent,
        screenSize: `${screen.width}x${screen.height}`,
        viewport: `${viewport.width}x${viewport.height}`,
      };
    } catch {
      return {
        type: "desktop" as const,
        userAgent: "",
        screenSize: "",
        viewport: "",
      };
    }
  }

  private getStoredSession(): SessionData | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = safeGetItem("sessionStorage", this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private saveSession(sessionData: SessionData): void {
    if (typeof window === "undefined") return;

    try {
      safeSetItem(
        "sessionStorage",
        this.STORAGE_KEY,
        JSON.stringify(sessionData)
      );
    } catch {
      // Silently fail
    }
  }

  private startActivityMonitoring(): void {
    if (typeof window === "undefined") return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const updateActivity = () => {
      this.updateActivity();
      this.resetActivityTimeout();
    };

    events.forEach((event) => {
      try {
        document.addEventListener(event, updateActivity, { passive: true });
      } catch {
        // Silently fail
      }
    });
  }

  private resetActivityTimeout(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    this.activityTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.ACTIVITY_TIMEOUT);
  }

  private handleSessionTimeout(): void {
    if (typeof window !== "undefined") {
      try {
        import("./tracker")
          .then(({ tracker }) => {
            tracker.trackSession(SessionEvent.SESSION_TIMEOUT, {
              session_duration: Date.now() - this.sessionData.startTime,
              pages_visited: this.sessionData.pageViews,
              interactions_count: this.sessionData.interactions,
            });
          })
          .catch(() => {
            // Silently fail
          });
      } catch {
        // Silently fail
      }
    }

    this.endSession();
  }

  private setupVisibilityTracking(): void {
    if (typeof window === "undefined") return;

    try {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.saveSession(this.sessionData);
        } else if (document.visibilityState === "visible") {
          this.updateActivity();
        }
      });
    } catch {
      // Silently fail
    }
  }

  // Public methods
  updateActivity(): void {
    this.sessionData.lastActivity = Date.now();
    this.sessionData.interactions++;
    this.saveSession(this.sessionData);
  }

  trackPageView(page: string): void {
    if (!this.isInitialized) return;

    const previousPage = this.sessionData.currentPage;
    this.sessionData.currentPage = page;
    this.sessionData.pageViews++;
    this.updateActivity();

    // Safe navigation tracking
    if (typeof window !== "undefined") {
      try {
        import("./tracker")
          .then(({ tracker }) => {
            tracker.trackNavigation("page_visited" as any, {
              from_page: previousPage,
              to_page: page,
            });
          })
          .catch(() => {
            // Silently fail
          });
      } catch {
        // Silently fail
      }
    }
  }

  setUser(userId: string, userEmail?: string): void {
    this.sessionData.userId = userId;
    this.sessionData.userEmail = userEmail;
    this.sessionData.isAuthenticated = true;
    this.saveSession(this.sessionData);

    // Identify user in PostHog safely
    safePostHogIdentify(userId, {
      email: userEmail,
      session_id: this.sessionData.sessionId,
      device_type: this.sessionData.deviceInfo.type,
    });
  }

  clearUser(): void {
    // Track logout before clearing user data
    if (this.sessionData.isAuthenticated && typeof window !== "undefined") {
      try {
        import("./tracker")
          .then(({ tracker }) => {
            tracker.trackSession(SessionEvent.SESSION_ENDED, {
              session_duration: Date.now() - this.sessionData.startTime,
              pages_visited: this.sessionData.pageViews,
              interactions_count: this.sessionData.interactions,
            });
          })
          .catch(() => {
            // Silently fail
          });
      } catch {
        // Silently fail
      }
    }

    // Clear user data
    this.sessionData.userId = undefined;
    this.sessionData.userEmail = undefined;
    this.sessionData.isAuthenticated = false;

    // Reset PostHog identity safely
    safePostHogReset();

    // Start a new anonymous session
    this.sessionData = this.initializeSession();
    this.saveSession(this.sessionData);
  }

  extendSession(): void {
    this.updateActivity();

    if (typeof window !== "undefined") {
      try {
        import("./tracker")
          .then(({ tracker }) => {
            tracker.trackSession(SessionEvent.SESSION_EXTENDED, {
              session_duration: Date.now() - this.sessionData.startTime,
            });
          })
          .catch(() => {
            // Silently fail
          });
      } catch {
        // Silently fail
      }
    }
  }

  endSession(): void {
    if (!this.isInitialized) return;

    if (typeof window !== "undefined") {
      try {
        import("./tracker")
          .then(({ tracker }) => {
            tracker.trackSession(SessionEvent.SESSION_ENDED, {
              session_duration: Date.now() - this.sessionData.startTime,
              pages_visited: this.sessionData.pageViews,
              interactions_count: this.sessionData.interactions,
            });
          })
          .catch(() => {
            // Silently fail
          });
      } catch {
        // Silently fail
      }
    }

    // Reset PostHog identity on session end
    safePostHogReset();

    // Clear session data
    safeRemoveItem("sessionStorage", this.STORAGE_KEY);

    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
  }

  getSessionData(): SessionData {
    return { ...this.sessionData };
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionData.startTime;
  }

  isSessionActive(): boolean {
    return Date.now() - this.sessionData.lastActivity < this.ACTIVITY_TIMEOUT;
  }

  getSessionSummary() {
    return {
      sessionId: this.sessionData.sessionId,
      duration: this.getSessionDuration(),
      pageViews: this.sessionData.pageViews,
      interactions: this.sessionData.interactions,
      isAuthenticated: this.sessionData.isAuthenticated,
      userId: this.sessionData.userId,
      entryPage: this.sessionData.entryPage,
      currentPage: this.sessionData.currentPage,
      deviceType: this.sessionData.deviceInfo.type,
      referrer: this.sessionData.referrer,
    };
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
