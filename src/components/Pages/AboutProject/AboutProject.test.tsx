import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import fs from "node:fs";
import path from "node:path";
import store from "@/store";
import { ChakraUIProvider } from "@/components/ui-components/ChakraPrimitives";
import AboutProject from "./AboutProject";
import { AboutMeSection, ProjectHero, QuestionSection } from "./AuthorThesisSection";
import { PlatformSection } from "./PlatformSection";
import { SystemArchitectureSection } from "./SystemArchitectureSection";
import { DataMethodSection } from "./DataMethodSection";
import { HypothesesSection } from "./Hypotheses/HypothesesSection";
import { ReadingResultsSection } from "./ReadingResultsSection";
import { TerminologySection } from "./TerminologySection";
import { GLOSSARY_OPEN_EVENT, GlossaryTerm } from "./GlossaryTerm";
import { LimitationsEthicsSection } from "./LimitationsEthicsSection";
import { TechStackSection } from "./TechStackSection";
import { TOC_ITEMS } from "./PageToc";
import {
  AUTHOR_FACTS,
  DATA_METHOD_CONTENT,
  GLOSSARY_ITEMS,
  HYPOTHESES_PILLARS,
  LIMITATIONS_ETHICS_CONTENT,
  PIPELINE_STEPS,
  PLATFORM_TABS,
  READING_RESULTS_CONTENT,
  SHOW_SUPERVISORS,
  TECH_STACK_CATEGORIES,
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

const ALL_HYPOTHESES = HYPOTHESES_PILLARS.flatMap((p) => p.hypotheses);

describe("AboutProject Page & Subcomponents", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("AboutProject Shell", () => {
    it("renders a single h1, the table of contents, and every TOC target section", () => {
      const { container } = renderWithProviders(<AboutProject />);

      const mainHeadings = screen.getAllByRole("heading", { level: 1 });
      expect(mainHeadings).toHaveLength(1);
      expect(mainHeadings[0]).toHaveTextContent("About this project");

      expect(container.querySelector('nav[aria-label="Table of contents"]')).toBeInTheDocument();

      for (const item of TOC_ITEMS) {
        expect(document.getElementById(item.id)).toBeInTheDocument();
      }
    });

    it("never renders TODO placeholders to readers", () => {
      const { container } = renderWithProviders(<AboutProject />);
      expect(container.textContent).not.toMatch(/TODO/);
    });
  });

  describe("ProjectHero", () => {
    it("shows the summary, key numbers and working links", () => {
      renderWithProviders(<ProjectHero />);

      expect(screen.getByText(/51,587/)).toBeInTheDocument();
      expect(screen.getByText(/posts analysed/i)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(AUTHOR_FACTS.name))).toBeInTheDocument();

      expect(screen.getByRole("link", { name: /Open the dashboard/i })).toHaveAttribute("href", "/");
      expect(screen.getByRole("link", { name: /View on GitHub/i })).toHaveAttribute(
        "href",
        AUTHOR_FACTS.links.github,
      );
    });
  });

  describe("QuestionSection", () => {
    it("renders the context, research question and thesis title", () => {
      renderWithProviders(<QuestionSection />);

      expect(screen.getByText(THE_QUESTION.paragraphs[0])).toBeInTheDocument();
      expect(screen.getByText(THE_QUESTION.researchQuestion)).toBeInTheDocument();
      expect(screen.getByText(THESIS_METADATA.title)).toBeInTheDocument();
    });
  });

  describe("AboutMeSection", () => {
    it("renders author facts, contact links and thesis contributions", () => {
      renderWithProviders(<AboutMeSection />);

      expect(screen.getByText(AUTHOR_FACTS.name)).toBeInTheDocument();
      expect(screen.getByText((c) => c.includes(AUTHOR_FACTS.institution))).toBeInTheDocument();
      expect(screen.getByText(AUTHOR_FACTS.bio)).toBeInTheDocument();
      expect(screen.getByText(AUTHOR_FACTS.whyIBuiltThis)).toBeInTheDocument();

      expect(screen.getByRole("link", { name: AUTHOR_FACTS.links.email })).toHaveAttribute(
        "href",
        `mailto:${AUTHOR_FACTS.links.email}`,
      );
      if (!AUTHOR_FACTS.links.linkedin) {
        expect(screen.queryByRole("link", { name: /LinkedIn/i })).not.toBeInTheDocument();
      }

      expect(screen.getByText(THESIS_CONTEXT.instrumentStatement)).toBeInTheDocument();
      for (const contrib of THESIS_CONTEXT.contributions) {
        expect(screen.getByText(contrib.title)).toBeInTheDocument();
      }

      if (!SHOW_SUPERVISORS) {
        expect(screen.queryByText(/Prof\. Dr\./i)).not.toBeInTheDocument();
      }
    });
  });

  describe("PlatformSection", () => {
    it("renders one tab per dashboard view and switches the screenshot", () => {
      renderWithProviders(<PlatformSection />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(PLATFORM_TABS.length);
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText(PLATFORM_TABS[0].caption)).toBeInTheDocument();

      fireEvent.click(tabs[1]);
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText(PLATFORM_TABS[1].caption)).toBeInTheDocument();
      expect(screen.getByRole("img")).toHaveAttribute("alt", PLATFORM_TABS[1].altText);
    });

    it("supports arrow-key navigation between tabs", () => {
      renderWithProviders(<PlatformSection />);
      const tabs = screen.getAllByRole("tab");
      fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
      fireEvent.keyDown(tabs[1], { key: "End" });
      expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true");
    });

    it("shows a placeholder for tabs without a screenshot", () => {
      const missing = PLATFORM_TABS.findIndex((t) => !t.imageSrc);
      if (missing === -1) return;
      renderWithProviders(<PlatformSection />);
      fireEvent.click(screen.getAllByRole("tab")[missing]);
      expect(screen.getByText(/No screenshot yet/i)).toBeInTheDocument();
    });

    it("opens the lightbox and closes it on Escape", () => {
      renderWithProviders(<PlatformSection />);

      fireEvent.click(screen.getByRole("button", { name: /Enlarge screenshot/i }));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByRole("button", { name: /Close image preview/i })).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("SystemArchitectureSection", () => {
    it("renders every pipeline step in order", () => {
      renderWithProviders(<SystemArchitectureSection />);

      const list = screen.getByRole("list", { name: /Data pipeline steps/i });
      const items = within(list).getAllByRole("listitem");
      expect(items).toHaveLength(PIPELINE_STEPS.length);
      PIPELINE_STEPS.forEach((step, i) => {
        expect(within(items[i]).getByText(step.title)).toBeInTheDocument();
        expect(within(items[i]).getByText(step.description)).toBeInTheDocument();
      });
    });
  });

  describe("DataMethodSection", () => {
    it("renders the 7-day rationale, kept and excluded fields, cleaning rules and models", () => {
      renderWithProviders(<DataMethodSection />);

      expect(screen.getByText(/Why wait 7 days/i)).toBeInTheDocument();
      expect(screen.getByText(DATA_METHOD_CONTENT.maturityWindowExplanation)).toBeInTheDocument();

      for (const field of DATA_METHOD_CONTENT.storedFields) {
        expect(screen.getByText(field.field)).toBeInTheDocument();
      }
      for (const excluded of DATA_METHOD_CONTENT.deliberatelyExcludedFields) {
        expect(screen.getByText(excluded)).toBeInTheDocument();
      }
      for (const filter of DATA_METHOD_CONTENT.cleaningFilters) {
        expect(screen.getByText(filter)).toBeInTheDocument();
      }

      expect(screen.getByText(/51,587 posts/)).toBeInTheDocument();

      for (const nlp of DATA_METHOD_CONTENT.nlpModels) {
        expect(screen.getByText(nlp.domain)).toBeInTheDocument();
        expect(screen.getByText(nlp.model)).toBeInTheDocument();
      }
    });
  });

  describe("HypothesesSection & HypothesisCard", () => {
    it("renders the summary table with one row per hypothesis", () => {
      renderWithProviders(<HypothesesSection />);

      const table = screen.getByRole("table", { name: /Summary of all hypothesis results/i });
      const rows = within(table).getAllByRole("row").slice(1); // skip header
      expect(rows).toHaveLength(ALL_HYPOTHESES.length);
      ALL_HYPOTHESES.forEach((h, i) => {
        expect(within(rows[i]).getByText(h.id)).toBeInTheDocument();
        expect(within(rows[i]).getByText(h.shortFinding)).toBeInTheDocument();
        expect(within(rows[i]).getByText(h.verdict)).toBeInTheDocument();
      });
    });

    it("summarises verdict counts in the lede from the data", () => {
      renderWithProviders(<HypothesesSection />);
      expect(screen.getByText(/Seven hypotheses.*Five held up, one held up with a tiny effect, and one couldn't be tested\./)).toBeInTheDocument();
    });

    it("renders every theme group and hypothesis card", () => {
      renderWithProviders(<HypothesesSection />);

      for (const pillar of HYPOTHESES_PILLARS) {
        expect(screen.getByRole("heading", { name: pillar.title })).toBeInTheDocument();
      }
      for (const h of ALL_HYPOTHESES) {
        expect(screen.getByRole("article", { name: h.name })).toBeInTheDocument();
      }
      expect(screen.getAllByTestId("echarts-mock")).toHaveLength(
        ALL_HYPOTHESES.filter((h) => h.chartType && h.chartType !== "none").length,
      );
    });

    it("keeps findings visible and puts method and stats in a disclosure", () => {
      renderWithProviders(<HypothesesSection />);

      const h1 = ALL_HYPOTHESES[0];
      const card = screen.getByRole("article", { name: h1.name });
      expect(within(card).getByText(h1.whatItTellsUs)).toBeInTheDocument();
      expect(within(card).getByText(h1.whatItDoesNotTellUs)).toBeInTheDocument();

      const details = card.querySelector("details");
      expect(details).not.toBeNull();
      expect(details).not.toHaveAttribute("open");
      expect(within(details as HTMLElement).getByText("Method and statistics")).toBeInTheDocument();
      expect(within(details as HTMLElement).getByText(h1.snapshotResult)).toBeInTheDocument();
      expect(within(details as HTMLElement).getByText(h1.formalStatement)).toBeInTheDocument();
      expect(within(details as HTMLElement).getByText(/ρ = \+0\.1924/)).toBeInTheDocument();
    });
  });

  describe("ReadingResultsSection", () => {
    it("renders all four guidance points", () => {
      renderWithProviders(<ReadingResultsSection />);

      for (const para of READING_RESULTS_CONTENT.paragraphs) {
        expect(screen.getByText(para.title)).toBeInTheDocument();
      }
      expect(screen.getByText(/ρ = −0\.0254/)).toBeInTheDocument();
    });
  });

  describe("TerminologySection & GlossaryTerm", () => {
    it("shows a collapsed alphabetical list and expands to all terms", () => {
      renderWithProviders(<TerminologySection />);

      expect(screen.getByPlaceholderText(/Search terms, formulas/i)).toBeInTheDocument();
      expect(document.getElementById("glossary-alpha")).toBeInTheDocument();
      expect(document.getElementById("glossary-zero-shot-classification")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: new RegExp(`Show all ${GLOSSARY_ITEMS.length} terms`) }));
      expect(document.getElementById("glossary-zero-shot-classification")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Show all/ })).not.toBeInTheDocument();
    });

    it("searches across all terms, even when collapsed", () => {
      renderWithProviders(<TerminologySection />);

      fireEvent.change(screen.getByPlaceholderText(/Search terms, formulas/i), {
        target: { value: "Welch" },
      });
      expect(screen.getByText("Welch's t-test")).toBeInTheDocument();
      expect(screen.queryByText("Shannon entropy")).not.toBeInTheDocument();
    });

    it("expands when an inline glossary link asks for an entry", () => {
      renderWithProviders(<TerminologySection />);
      expect(document.getElementById("glossary-welchs-t-test")).not.toBeInTheDocument();
      act(() => {
        window.dispatchEvent(new CustomEvent(GLOSSARY_OPEN_EVENT, { detail: "welchs-t-test" }));
      });
      expect(document.getElementById("glossary-welchs-t-test")).toBeInTheDocument();
    });

    it("renders an accessible inline GlossaryTerm with a tooltip on hover", () => {
      renderWithProviders(
        <div>
          Here is <GlossaryTerm termId="shannon-entropy">Shannon entropy</GlossaryTerm> inline.
        </div>,
      );

      const link = screen.getByRole("link", { name: "Shannon entropy" });
      expect(link).toHaveAttribute("href", "#glossary-shannon-entropy");
      expect(link).toHaveAttribute("aria-describedby", "tooltip-shannon-entropy");

      fireEvent.mouseEnter(link.parentElement as HTMLElement);
      expect(screen.getByRole("tooltip")).toHaveTextContent(/How spread out a set of probabilities is/);
    });
  });

  describe("LimitationsEthicsSection", () => {
    it("renders limitations, ethics points and the privacy link", () => {
      renderWithProviders(<LimitationsEthicsSection />);

      for (const item of [...LIMITATIONS_ETHICS_CONTENT.limitations, ...LIMITATIONS_ETHICS_CONTENT.ethics]) {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      }
      expect(screen.getByText(/GDPR Art\. 17/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute("href", "/privacy");
    });
  });

  describe("TechStackSection", () => {
    it("renders every category and technology", () => {
      renderWithProviders(<TechStackSection />);

      for (const cat of TECH_STACK_CATEGORIES) {
        expect(screen.getByRole("heading", { name: cat.category })).toBeInTheDocument();
        for (const tech of cat.technologies) {
          expect(screen.getByText(tech.name)).toBeInTheDocument();
        }
      }
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
