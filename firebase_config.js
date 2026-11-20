import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getAnalytics,
  isSupported,
  logEvent,
  setAnalyticsCollectionEnabled,
} from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YYPYW7SSGM",
};

// Initialize Firebase App unconditionally so authentication is unaffected
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication unconditionally on load
export const auth = getAuth(app);

export const CONSENT_STORAGE_KEY = "analytics_consent";

let analyticsInstance = null;

/**
 * Returns whether the visitor has given explicit opt-in consent for analytics.
 */
export const hasAnalyticsConsent = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted";
};

/**
 * Initializes Firebase Analytics only if explicit opt-in consent has been granted
 * and browser environment is supported. getAnalytics(app) is never called without verified consent.
 */
export const initAnalyticsIfConsented = async () => {
  if (!hasAnalyticsConsent()) {
    return null;
  }

  if (analyticsInstance) {
    try {
      setAnalyticsCollectionEnabled(analyticsInstance, true);
    } catch {
      // Suppress runtime warning if collection state transition is redundant
    }
    return analyticsInstance;
  }

  try {
    const supported = await isSupported();
    if (supported && hasAnalyticsConsent()) {
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch (err) {
    console.error("Firebase Analytics initialization failed:", err);
  }

  return null;
};

/**
 * Logs the current page view event to Firebase Analytics if consent is granted.
 * Initializes Firebase Analytics immediately without requiring a page reload.
 */
export const logCurrentPageView = async (
  pagePath = typeof window !== "undefined" ? window.location.pathname : "/",
  pageTitle = typeof document !== "undefined" ? document.title : "",
) => {
  const analytics = await initAnalyticsIfConsented();
  if (analytics && typeof window !== "undefined") {
    try {
      logEvent(analytics, "page_view", {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: pageTitle,
      });
    } catch (err) {
      console.error("Failed to log page view event:", err);
    }
  }
};

/**
 * Disables Firebase Analytics collection, sets the Google Analytics opt-out flag,
 * and clears Google Analytics cookies from the browser document.
 */
export const disableAnalytics = () => {
  if (analyticsInstance) {
    try {
      setAnalyticsCollectionEnabled(analyticsInstance, false);
    } catch {
      // Suppress runtime warning
    }
  }

  if (typeof window !== "undefined") {
    const measurementId =
      import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YYPYW7SSGM";

    if (measurementId) {
      window[`ga-disable-${measurementId}`] = true;
    }

    try {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.slice(0, eqPos) : cookie;
        if (
          name === "_ga" ||
          name === "_gid" ||
          name === "_gat" ||
          name.startsWith("_ga_") ||
          name.startsWith("_gac_")
        ) {
          const host = window.location.hostname;
          const hostParts = host.split(".");
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${host};`;
          if (hostParts.length > 1) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${hostParts.slice(-2).join(".")};`;
          }
        }
      }
    } catch {
      // Document cookie access may be restricted in sandboxed iframe environments
    }
  }
};
