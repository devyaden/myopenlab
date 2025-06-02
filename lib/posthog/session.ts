import posthog from "posthog-js";
import { tracker } from "./tracker";
import { SessionEvent } from "./events";

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

  constructor() {
    this.sessionData = this.initializeSession();
    this.startActivityMonitoring();
    this.setupVisibilityTracking();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private initializeSession(): SessionData {
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
      referrer: document.referrer,
      deviceInfo: this.getDeviceInfo(),
    };

    this.saveSession(newSession);

    // Track new session start
    tracker.trackSession(SessionEvent.SESSION_STARTED, {
      session_type: existingSession ? "returning" : "new",
      device_type: newSession.deviceInfo.type,
    });

    return newSession;
  }

  private generateSessionId(): string {
    return `yadn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
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
  }

  private getStoredSession(): SessionData | null {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn("Failed to parse stored session:", error);
      return null;
    }
  }

  private saveSession(sessionData: SessionData) {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.warn("Failed to save session:", error);
    }
  }

  private startActivityMonitoring() {
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
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  private resetActivityTimeout() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    this.activityTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.ACTIVITY_TIMEOUT);
  }

  private handleSessionTimeout() {
    tracker.trackSession(SessionEvent.SESSION_TIMEOUT, {
      session_duration: Date.now() - this.sessionData.startTime,
      pages_visited: this.sessionData.pageViews,
      interactions_count: this.sessionData.interactions,
    });

    this.endSession();
  }

  private setupVisibilityTracking() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.saveSession(this.sessionData);
      } else if (document.visibilityState === "visible") {
        this.updateActivity();
      }
    });
  }

  // Public methods
  updateActivity() {
    this.sessionData.lastActivity = Date.now();
    this.sessionData.interactions++;
    this.saveSession(this.sessionData);
  }

  trackPageView(page: string) {
    const previousPage = this.sessionData.currentPage;
    this.sessionData.currentPage = page;
    this.sessionData.pageViews++;
    this.updateActivity();

    tracker.trackNavigation("page_visited" as any, {
      from_page: previousPage,
      to_page: page,
    });
  }

  setUser(userId: string, userEmail?: string) {
    this.sessionData.userId = userId;
    this.sessionData.userEmail = userEmail;
    this.sessionData.isAuthenticated = true;
    this.saveSession(this.sessionData);

    // Identify user in PostHog
    if (typeof window !== "undefined" && posthog) {
      posthog.identify(userId, {
        email: userEmail,
        session_id: this.sessionData.sessionId,
        device_type: this.sessionData.deviceInfo.type,
      });
    }
  }

  clearUser() {
    // Track logout before clearing user data
    if (this.sessionData.isAuthenticated) {
      tracker.trackSession(SessionEvent.SESSION_ENDED, {
        session_duration: Date.now() - this.sessionData.startTime,
        pages_visited: this.sessionData.pageViews,
        interactions_count: this.sessionData.interactions,
      });
    }

    // Clear user data
    this.sessionData.userId = undefined;
    this.sessionData.userEmail = undefined;
    this.sessionData.isAuthenticated = false;

    // Reset PostHog identity - this is the key fix!
    if (typeof window !== "undefined" && posthog) {
      posthog.reset();
    }

    // Start a new anonymous session
    this.sessionData = this.initializeSession();
    this.saveSession(this.sessionData);
  }

  extendSession() {
    this.updateActivity();
    tracker.trackSession(SessionEvent.SESSION_EXTENDED, {
      session_duration: Date.now() - this.sessionData.startTime,
    });
  }

  endSession() {
    tracker.trackSession(SessionEvent.SESSION_ENDED, {
      session_duration: Date.now() - this.sessionData.startTime,
      pages_visited: this.sessionData.pageViews,
      interactions_count: this.sessionData.interactions,
    });

    // Reset PostHog identity on session end
    if (typeof window !== "undefined" && posthog) {
      posthog.reset();
    }

    // Clear session data
    sessionStorage.removeItem(this.STORAGE_KEY);

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

  // Method to get session summary for analytics
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
