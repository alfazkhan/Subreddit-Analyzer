import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ChakraUIProvider } from "@/components/ui-components/ChakraPrimitives";
import ConsentBanner from "./ConsentBanner";
import PrivacyPolicy from "./PrivacyPolicy";
import Footer from "@/components/ui-components/Footer";
import { CONSENT_STORAGE_KEY } from "@/util/analyticsConsent";

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <ChakraUIProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ChakraUIProvider>,
  );
}

describe("Privacy and Consent Components", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe("ConsentBanner", () => {
    it("renders the banner when consent is not yet determined", () => {
      renderWithProviders(<ConsentBanner />);

      expect(
        screen.getByText("Privacy & Analytics Preferences"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Accept Analytics" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeInTheDocument();
    });

    it("does not render when consent is already set", () => {
      localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
      renderWithProviders(<ConsentBanner />);

      expect(
        screen.queryByText("Privacy & Analytics Preferences"),
      ).not.toBeInTheDocument();
    });

    it("persists accepted consent when Accept Analytics is clicked", () => {
      renderWithProviders(<ConsentBanner />);

      const acceptBtn = screen.getByRole("button", { name: "Accept Analytics" });
      fireEvent.click(acceptBtn);

      expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("accepted");
      expect(
        screen.queryByText("Privacy & Analytics Preferences"),
      ).not.toBeInTheDocument();
    });

    it("persists rejected consent when Reject is clicked", () => {
      renderWithProviders(<ConsentBanner />);

      const rejectBtn = screen.getByRole("button", { name: "Reject" });
      fireEvent.click(rejectBtn);

      expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("rejected");
      expect(
        screen.queryByText("Privacy & Analytics Preferences"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("renders 1-click link to Privacy Policy and Cookie Settings trigger", () => {
      renderWithProviders(<Footer />);

      const privacyLinks = screen.getAllByRole("link", { name: "Privacy Policy" });
      expect(privacyLinks.length).toBeGreaterThanOrEqual(1);
      expect(privacyLinks[0]).toHaveAttribute("href", "/privacy");

      const cookieBtn = screen.getByRole("button", { name: "Cookie Settings" });
      expect(cookieBtn).toBeInTheDocument();
    });

    it("reopens consent banner when Cookie Settings is clicked", () => {
      localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
      renderWithProviders(<Footer />);

      expect(
        screen.queryByText("Privacy & Analytics Preferences"),
      ).not.toBeInTheDocument();

      const cookieBtn = screen.getByRole("button", { name: "Cookie Settings" });
      fireEvent.click(cookieBtn);

      expect(
        screen.getByText("Privacy & Analytics Preferences"),
      ).toBeInTheDocument();
    });
  });

  describe("PrivacyPolicy Page", () => {
    it("renders privacy policy headings and Manage Analytics Preferences button", () => {
      renderWithProviders(<PrivacyPolicy />);

      const headings = screen.getAllByRole("heading", { name: "Privacy Policy" });
      expect(headings.length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByRole("button", { name: "Manage Analytics Preferences" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Back to Home" }),
      ).toBeInTheDocument();
    });
  });
});
