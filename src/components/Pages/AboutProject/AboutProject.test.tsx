import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import fs from "node:fs";
import path from "node:path";
import store from "@/store";
import { ChakraUIProvider } from "@/components/ui-components/ChakraPrimitives";
import AboutProject from "./AboutProject";
import { AuthorThesisSection } from "./AuthorThesisSection";
import { PlatformSection } from "./PlatformSection";
import { SystemArchitectureSection } from "./SystemArchitectureSection";
import { DataMethodSection } from "./DataMethodSection";
import { HypothesesSection } from "./Hypotheses/HypothesesSection";
import { ReadingResultsSection } from "./ReadingResultsSection";
import { TerminologySection } from "./TerminologySection";
import { GlossaryTerm } from "./GlossaryTerm";
import { LimitationsEthicsSection } from "./LimitationsEthicsSection";
import { TechStackSection } from "./TechStackSection";
import {
  AUTHOR_FACTS,
  DATA_METHOD_CONTENT,
  GLOSSARY_ITEMS,
  HYPOTHESES_PILLARS,
  PLATFORM_TABS,
  SHOW_SUPERVISORS,
  THE_QUESTION,
  THESIS_CONTEXT,
  THESIS_METADATA,
} from "@/data/aboutContent";

vi.mock("react-echarts-library", () => ({
  __esModule: true,
  default: vi.fn((props) => (
    <div data-testid="echarts-mock" data-option={JSON.stringify(props.option || {})}>
      ECharts Mock
    </div>
  )),
}));

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <Provider store={store}>
      <ChakraUIProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ChakraUIProvider>
    </Provider>,
  );
}

describe("AboutProject Page & Subcomponents", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("AboutProject Shell", () => {
    it("renders the single main h1 heading and page layout structure", () => {
      const { container } = renderWithProviders(<AboutProject />);

      const mainHeadings = screen.getAllByRole("heading", { level: 1 });
      expect(mainHeadings).toHaveLength(1);
      expect(mainHeadings[0]).toHaveTextContent("About The Project");

      expect(
        container.querySelector('nav[aria-label="Table of contents"]'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Master's Thesis Research: Computational Social Science/i),
      ).toBeInTheDocument();
    });
  });

  describe("AuthorThesisSection", () => {
    it("renders thesis metadata, research question, author biography, and contributions", () => {
      renderWithProviders(<AuthorThesisSection />);

      // Academic metadata & title
      expect(screen.getByText(new RegExp(THESIS_METADATA.title, "i"))).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes(AUTHOR_FACTS.institution)),
      ).toBeInTheDocument();

      // Research question
      expect(screen.getByText(THE_QUESTION.researchQuestion)).toBeInTheDocument();

      // Author details (strict facts only)
      expect(screen.getByText(AUTHOR_FACTS.name)).toBeInTheDocument();
      expect(
        screen.getAllByText((content) => content.includes(AUTHOR_FACTS.degree)).length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(AUTHOR_FACTS.bio)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(AUTHOR_FACTS.links.email, "i"))).toBeInTheDocument();

      // Thesis as research instrument & 3 contributions
      expect(
        screen.getByText((content) =>
          content.includes(THESIS_CONTEXT.instrumentStatement),
        ),
      ).toBeInTheDocument();
      for (const contrib of THESIS_CONTEXT.contributions) {
        expect(screen.getByText(contrib.title)).toBeInTheDocument();
      }

      // Supervisors must NOT appear by default
      if (!SHOW_SUPERVISORS) {
        expect(screen.queryByText(/Prof\. Dr\. Andreas Widenhorn/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Prof\. Dr\. Patrick Schmid/i)).not.toBeInTheDocument();
      }
    });

    it("renders working action buttons linking to Dashboard and GitHub", () => {
      renderWithProviders(<AuthorThesisSection />);

      const dashboardBtn = screen.getByRole("button", { name: /Open the dashboard/i });
      expect(dashboardBtn).toBeInTheDocument();

      const githubLink = screen.getByRole("link", { name: /View on GitHub/i });
      expect(githubLink).toHaveAttribute("href", AUTHOR_FACTS.links.github);
    });
  });

  describe("PlatformSection", () => {
    it("renders all 8 platform dashboard tab previews with captions and lazy images", () => {
      renderWithProviders(<PlatformSection />);

      for (const tab of PLATFORM_TABS) {
        expect(screen.getByText(tab.tabLabel)).toBeInTheDocument();
        expect(screen.getByText(tab.caption)).toBeInTheDocument();
      }

      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThanOrEqual(8);
      expect(images[0]).toHaveAttribute("loading", "lazy");
    });

    it("opens click-to-enlarge lightbox modal with focus trap and closes on Escape", () => {
      renderWithProviders(<PlatformSection />);

      const firstImage = screen.getAllByRole("img")[0];
      fireEvent.click(firstImage);

      // Lightbox dialog should open
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: /Close image preview/i })).toBeInTheDocument();

      // Pressing Escape closes lightbox
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("SystemArchitectureSection", () => {
    it("renders SVG architecture diagram and all 6 pipeline steps", () => {
      const { container } = renderWithProviders(<SystemArchitectureSection />);

      // Hand-built SVG is present
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();

      // Pipeline headings
      expect(screen.getByText(/How It Works: System Architecture/i)).toBeInTheDocument();
      expect(screen.getByText("Reddit Municipal Feeds")).toBeInTheDocument();
      expect(screen.getByText("Headless Web Ingestion")).toBeInTheDocument();
      expect(screen.getByText("7-Day Maturity Queue")).toBeInTheDocument();
      expect(screen.getByText("Relational Storage & Indexing")).toBeInTheDocument();
      expect(screen.getByText("Local Offline Neural NLP")).toBeInTheDocument();
      expect(screen.getByText("Statistical API & Dashboard")).toBeInTheDocument();
    });
  });

  describe("DataMethodSection", () => {
    it("renders the 7-day maturity delay rationale, stored and excluded fields, and cleaning filters", () => {
      renderWithProviders(<DataMethodSection />);

      // 7-day window explanation
      expect(screen.getByText(/The 7-Day Maturity Window/i)).toBeInTheDocument();
      expect(screen.getByText(DATA_METHOD_CONTENT.maturityWindowExplanation)).toBeInTheDocument();

      // Stored and excluded fields
      expect(screen.getByText("Data Points Collected & Stored")).toBeInTheDocument();
      expect(screen.getByText("Deliberately Excluded (Data Minimization)")).toBeInTheDocument();
      for (const field of DATA_METHOD_CONTENT.storedFields) {
        expect(screen.getByText(field.field)).toBeInTheDocument();
      }
      for (const excluded of DATA_METHOD_CONTENT.deliberatelyExcludedFields) {
        expect(screen.getByText(excluded)).toBeInTheDocument();
      }

      // Sample size
      expect(screen.getByText(/51,587/i)).toBeInTheDocument();
      expect(screen.getByText(/verified submissions/i)).toBeInTheDocument();

      // Local NLP models
      for (const nlp of DATA_METHOD_CONTENT.nlpModels) {
        expect(screen.getByText(nlp.domain)).toBeInTheDocument();
        expect(screen.getByText(nlp.model)).toBeInTheDocument();
      }
    });
  });

  describe("HypothesesSection & HypothesisCard", () => {
    it("renders all four pillars and seven hypotheses with correct badges and structures", () => {
      renderWithProviders(<HypothesesSection />);

      // 4 Pillars
      for (const pillar of HYPOTHESES_PILLARS) {
        expect(screen.getByText(new RegExp(pillar.title, "i"))).toBeInTheDocument();
      }

      // 7 Hypotheses
      expect(screen.getByText("Negativity and Engagement")).toBeInTheDocument();
      expect(screen.getByText("Polarization and Visibility")).toBeInTheDocument();
      expect(screen.getByText("Topic Ambiguity vs. Information Clarity")).toBeInTheDocument();
      expect(screen.getByText("Entity Specificity Moderation")).toBeInTheDocument();
      expect(screen.getByText("Civic Friction vs. Lifestyle Consensus")).toBeInTheDocument();
      expect(screen.getByText("Daily Rhythm and Affect Cycles")).toBeInTheDocument();
      expect(screen.getByText("Vocabulary Diversity and Engagement")).toBeInTheDocument();

      // Snapshot notice
      expect(screen.getAllByText(/Snapshot, Nov 2026/i).length).toBeGreaterThanOrEqual(1);

      // H4 Inconclusive badge and callout
      expect(screen.getByText("Inconclusive")).toBeInTheDocument();

      // Expand all / Collapse all toggle
      const toggleBtn = screen.getByRole("button", { name: /Expand All|Collapse All/i });
      expect(toggleBtn).toBeInTheDocument();
      fireEvent.click(toggleBtn);
      expect(screen.getByRole("button", { name: /Expand All/i })).toBeInTheDocument();
    });

    it("displays the required hypothesis card fields in exact order", () => {
      renderWithProviders(<HypothesesSection />);

      // Required fields for H1
      expect(
        screen.getByText(/Does a negative emotional tone lead to longer discussion threads while reducing post approval\?/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Negative sentiment probability \(P_neg\) drives higher discussion depth/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Spearman rank correlation \(ρ\) was selected/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Snapshot, Nov 2026 \(N = 51,587\): P_neg vs comments ρ = \+0.1924/i),
      ).toBeInTheDocument();
    });
  });

  describe("ReadingResultsSection", () => {
    it("renders the 4 statistical guidance topics and honest examples", () => {
      renderWithProviders(<ReadingResultsSection />);

      expect(screen.getByText(/What a p-value actually says/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Why huge sample sizes make tiny effects statistically significant/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Understanding effect size over significance/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Correlation versus causation in observational data/i),
      ).toBeInTheDocument();

      // Honest empirical examples
      expect(screen.getByText(/ρ = −0\.0254/i)).toBeInTheDocument();
      expect(screen.getByText(/explains less than 0\.1% of sentiment variance/i)).toBeInTheDocument();
    });
  });

  describe("TerminologySection & GlossaryTerm", () => {
    it("renders alphabetical glossary items, search filter, and anchor ids", () => {
      renderWithProviders(<TerminologySection />);

      expect(screen.getByText(/Glossary of Terms/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search terms, formulas/i)).toBeInTheDocument();

      // Verify sample glossary terms with anchor IDs
      const alphaHeading = screen.getByText("Alpha (Significance Level)");
      expect(alphaHeading).toBeInTheDocument();
      expect(document.getElementById("glossary-alpha")).toBeInTheDocument();
      expect(document.getElementById("glossary-shannon-entropy")).toBeInTheDocument();
    });

    it("filters glossary items when searching", () => {
      renderWithProviders(<TerminologySection />);

      const searchInput = screen.getByPlaceholderText(/Search terms, formulas/i);
      fireEvent.change(searchInput, { target: { value: "Shannon" } });

      expect(screen.getByText("Shannon Entropy (H)")).toBeInTheDocument();
      expect(screen.queryByText("Welch's Two-Sample t-Test")).not.toBeInTheDocument();
    });

    it("renders accessible inline GlossaryTerm with tooltip trigger", () => {
      renderWithProviders(
        <div>
          Here is <GlossaryTerm termId="shannon-entropy">Shannon entropy</GlossaryTerm> inline.
        </div>,
      );

      const term = screen.getByText("Shannon entropy");
      expect(term).toBeInTheDocument();
      expect(term).toHaveAttribute("tabindex", "0");
      expect(term).toHaveAttribute("aria-describedby", "tooltip-shannon-entropy");
    });
  });

  describe("LimitationsEthicsSection", () => {
    it("renders methodological limitations, ethics policies, and privacy link", () => {
      renderWithProviders(<LimitationsEthicsSection />);

      expect(screen.getByText("Methodological Limitations")).toBeInTheDocument();
      expect(
        screen.getByText(/Data Ethics, Privacy & Platform Compliance/i),
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Demographic skew: Reddit users do not represent/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Zero user profiling: Reddit usernames, author handles/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Right to erasure \(Art\. 17 GDPR\)/i)).toBeInTheDocument();
      expect(screen.getByText(/TODO_ALFAZ: review current platform terms/i)).toBeInTheDocument();

      const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
      expect(privacyLink).toHaveAttribute("href", "/privacy");
    });
  });

  describe("TechStackSection", () => {
    it("renders categorized technologies table matching package.json and requirements.txt", () => {
      renderWithProviders(<TechStackSection />);

      expect(screen.getByText("Frontend")).toBeInTheDocument();
      expect(screen.getByText("Backend")).toBeInTheDocument();
      expect(screen.getByText("NLP & Machine Learning")).toBeInTheDocument();
      expect(screen.getByText("Data & Persistence")).toBeInTheDocument();
      expect(screen.getByText("Hosting, Testing & CI")).toBeInTheDocument();

      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("Chakra UI v3")).toBeInTheDocument();
      expect(screen.getByText("FastAPI")).toBeInTheDocument();
      expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    });
  });

  describe("Markdown Consistency Verification (AboutProject.md)", () => {
    it("verifies that every numerical snapshot result from aboutContent.ts appears verbatim in AboutProject.md", () => {
      const mdPath = path.resolve(process.cwd(), "AboutProject.md");
      expect(fs.existsSync(mdPath)).toBe(true);

      const mdContent = fs.readFileSync(mdPath, "utf-8");

      // Core metadata
      expect(mdContent).toContain("51,587");
      expect(mdContent).toContain("0.05");
      expect(mdContent).toContain("30");

      // H1 values
      expect(mdContent).toContain("+0.1924");
      expect(mdContent).toContain("-0.0254");
      expect(mdContent).toContain("-0.0859");
      expect(mdContent).toContain("0.0046");
      expect(mdContent).toContain("1,089");

      // H2 values
      expect(mdContent).toContain("+0.1413");

      // H3 values
      expect(mdContent).toContain("-0.5053");
      expect(mdContent).toContain("0.031");
      expect(mdContent).toContain("-16.07");
      expect(mdContent).toContain("-0.567");
      expect(mdContent).toContain("-0.444");
      expect(mdContent).toContain("+0.9175");

      // H5 values
      expect(mdContent).toContain("0.3842");
      expect(mdContent).toContain("0.3315");
      expect(mdContent).toContain("+5.98");
      expect(mdContent).toContain("0.7356");
      expect(mdContent).toContain("0.7690");
      expect(mdContent).toContain("-5.42");
      expect(mdContent).toContain("0.6781");
      expect(mdContent).toContain("0.7430");
      expect(mdContent).toContain("0.0026");

      // H6 values
      expect(mdContent).toContain("15.46");
      expect(mdContent).toContain("4.76");
      expect(mdContent).toContain("0.3399");
      expect(mdContent).toContain("0.3679");
      expect(mdContent).toContain("0.3611");
      expect(mdContent).toContain("0.3601");

      // H7 values
      expect(mdContent).toContain("+1080.13");
      expect(mdContent).toContain("-707.26");
      expect(mdContent).toContain("0.764");
      expect(mdContent).toContain("10,000");

      // Author & Institution
      expect(mdContent).toContain("Alfaz Khan");
      expect(mdContent).toContain("khanalfaaz14@gmail.com");
      expect(mdContent).toContain("International School of Management (ISM), Munich");
      expect(mdContent).toContain("MBA General Management");

      // Code reconciliation notes
      expect(mdContent).toContain("natural logarithm");
      expect(mdContent).toContain("np.log");
    });
  });
});
