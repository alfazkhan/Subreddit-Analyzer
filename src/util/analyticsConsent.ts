import { useCallback, useEffect, useState } from "react";
import * as firebaseConfig from "../../firebase_config";

export const CONSENT_STORAGE_KEY = "analytics_consent";
export type ConsentStatus = "accepted" | "rejected" | null;

export const OPEN_CONSENT_EVENT = "open-analytics-consent";
export const CONSENT_CHANGE_EVENT = "analytics-consent-change";

/**
 * Retrieves the stored analytics consent choice from localStorage.
 */
export function getAnalyticsConsent(): ConsentStatus {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  const val = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (val === "accepted" || val === "rejected") {
    return val;
  }
  return null;
}

/**
 * Returns true only if the user has explicitly accepted analytics cookies.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof firebaseConfig.hasAnalyticsConsent === "function") {
    return firebaseConfig.hasAnalyticsConsent();
  }
  return getAnalyticsConsent() === "accepted";
}

/**
 * Persists user consent choice, initializes or tears down analytics, and emits change events.
 * When status is accepted, immediately initializes analytics and logs the current page view.
 */
export function setAnalyticsConsent(status: "accepted" | "rejected"): void {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, status);
    window.dispatchEvent(
      new CustomEvent(CONSENT_CHANGE_EVENT, { detail: { status } }),
    );
  }

  if (status === "accepted") {
    if (typeof firebaseConfig.logCurrentPageView === "function") {
      void firebaseConfig.logCurrentPageView();
    } else if (typeof firebaseConfig.initAnalyticsIfConsented === "function") {
      void firebaseConfig.initAnalyticsIfConsented();
    }
  } else {
    if (typeof firebaseConfig.disableAnalytics === "function") {
      firebaseConfig.disableAnalytics();
    }
  }
}

/**
 * Explicitly logs the current page view if analytics consent is granted.
 */
export async function logCurrentPageView(
  pagePath?: string,
  pageTitle?: string,
): Promise<void> {
  if (typeof firebaseConfig.logCurrentPageView === "function") {
    await firebaseConfig.logCurrentPageView(pagePath, pageTitle);
  }
}

/**
 * Broadcasts an event to reopen the consent banner/modal.
 */
export function openConsentBanner(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
  }
}

/**
 * React hook to observe and control analytics consent status and banner visibility.
 */
export function useAnalyticsConsent() {
  const [consent, setConsentState] = useState<ConsentStatus>(() =>
    getAnalyticsConsent(),
  );
  const [isOpen, setIsOpen] = useState<boolean>(
    () => getAnalyticsConsent() === null,
  );

  useEffect(() => {
    if (hasAnalyticsConsent()) {
      if (typeof firebaseConfig.logCurrentPageView === "function") {
        void firebaseConfig.logCurrentPageView();
      } else if (typeof firebaseConfig.initAnalyticsIfConsented === "function") {
        void firebaseConfig.initAnalyticsIfConsented();
      }
    }

    const handleConsentChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ status: ConsentStatus }>;
      if (customEvent.detail && customEvent.detail.status) {
        setConsentState(customEvent.detail.status);
      } else {
        setConsentState(getAnalyticsConsent());
      }
    };

    const handleOpenBanner = () => {
      setIsOpen(true);
    };

    window.addEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);
    window.addEventListener(OPEN_CONSENT_EVENT, handleOpenBanner);

    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);
      window.removeEventListener(OPEN_CONSENT_EVENT, handleOpenBanner);
    };
  }, []);

  const accept = useCallback(() => {
    setAnalyticsConsent("accepted");
    setConsentState("accepted");
    setIsOpen(false);
  }, []);

  const reject = useCallback(() => {
    setAnalyticsConsent("rejected");
    setConsentState("rejected");
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    consent,
    isOpen,
    accept,
    reject,
    open,
    close,
  };
}
