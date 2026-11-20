import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  getAnalyticsConsent,
  hasAnalyticsConsent,
  setAnalyticsConsent,
  openConsentBanner,
  OPEN_CONSENT_EVENT,
  CONSENT_CHANGE_EVENT,
} from "./analyticsConsent";

describe("analytics consent utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns null consent status when no choice is in localStorage", () => {
    expect(getAnalyticsConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("returns true for hasAnalyticsConsent only when status is accepted", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    expect(getAnalyticsConsent()).toBe("accepted");
    expect(hasAnalyticsConsent()).toBe(true);

    localStorage.setItem(CONSENT_STORAGE_KEY, "rejected");
    expect(getAnalyticsConsent()).toBe("rejected");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("dispatches event and saves to localStorage when accepting consent", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    setAnalyticsConsent("accepted");

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("accepted");
    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(CONSENT_CHANGE_EVENT);
    expect(event.detail).toEqual({ status: "accepted" });
  });

  it("dispatches event and saves to localStorage when rejecting consent", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    setAnalyticsConsent("rejected");

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("rejected");
    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(CONSENT_CHANGE_EVENT);
    expect(event.detail).toEqual({ status: "rejected" });
  });

  it("dispatches open event when calling openConsentBanner", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    openConsentBanner();

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(OPEN_CONSENT_EVENT);
  });

  it("handles logCurrentPageView gracefully", async () => {
    const { logCurrentPageView } = await import("./analyticsConsent");
    await expect(logCurrentPageView()).resolves.toBeUndefined();
  });
});
