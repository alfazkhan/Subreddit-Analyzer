import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChakraUIProvider } from "@/components/ui-components/ChakraPrimitives";
import DataTabs from "./DataTabs";

vi.mock("firebase/auth", () => ({ onAuthStateChanged: vi.fn() }));
vi.mock("../../../../../firebase_config", () => ({ auth: {} }));
vi.mock("react-echarts-library", () => ({
  __esModule: true,
  default: vi.fn((props) => (
    <div data-testid="echarts-mock" data-option={JSON.stringify(props.option)}>
      ECharts Mock
    </div>
  )),
}));

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});

function createJsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderDataTabs() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <ChakraUIProvider>
      <QueryClientProvider client={queryClient}>
        <DataTabs postsData={[]} processingStatus={false} />
      </QueryClientProvider>
    </ChakraUIProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DataTabs KPI tab", () => {
  it("prioritizes chart data, fetches hypotheses sequentially without tab switching, shows calculating text without progress bar, and keeps tabs mounted", async () => {
    const kpiSeriesDeferred = createDeferred<Response>();
    const hypothesisDeferreds = Array.from({ length: 7 }, () =>
      createDeferred<Response>(),
    );
    const kpiFetchOrder: string[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/subreddits/sentiments/frequency")) {
          return Promise.resolve(createJsonResponse({ labels: [], metrics: {} }));
        }
        if (url.includes("/kpis/series")) {
          kpiFetchOrder.push("series");
          return kpiSeriesDeferred.promise;
        }
        for (let i = 0; i < 7; i++) {
          const key = `h${i + 1}`;
          if (url.includes(`/kpis/${key}`)) {
            kpiFetchOrder.push(key);
            return hypothesisDeferreds[i].promise;
          }
        }
        return Promise.resolve(createJsonResponse({}));
      }),
    );

    renderDataTabs();

    fireEvent.click(screen.getByRole("tab", { name: "KPIs" }));

    expect(await screen.findByText("Social Media Empirical KPIs")).toBeVisible();

    // No download progress bar should be rendered; calculating text should be visible
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    const visibleCalculatingTexts = screen
      .getAllByText("Calculating data points...")
      .filter((element) => {
        try {
          expect(element).toBeVisible();
          return true;
        } catch {
          return false;
        }
      });
    expect(visibleCalculatingTexts.length).toBeGreaterThanOrEqual(2);

    // All hypothesis panels are mounted upfront (no lazyMount)
    const mountedPanels = screen.getAllByRole("tabpanel", { hidden: true });
    for (let i = 1; i <= 7; i++) {
      const tab = screen.getByRole("tab", { name: `Hypothesis ${i}` });
      const panel = mountedPanels.find(
        (element) => element.getAttribute("aria-labelledby") === tab.id,
      );
      expect(panel).toBeInTheDocument();
    }

    // Only chart data should have been requested so far
    expect(kpiFetchOrder).toEqual(["series"]);

    kpiSeriesDeferred.resolve(
      createJsonResponse({
        summary: { total_analyzed_posts: 250 },
        time_series: [
          {
            date: "2026-01-01",
            post_count: 250,
            avg_negative_sentiment: 0.25,
            avg_neg_sentiment_SMA: 0.22,
            avg_upvote_ratio: 0.84,
            avg_upvote_ratio_SMA: 0.85,
            avg_score: 42,
            avg_num_comments: 12,
          },
        ],
      }),
    );

    const kpiPanel = screen.getByRole("tabpanel", { name: "KPIs" });
    expect(await within(kpiPanel).findByTestId("echarts-mock")).toBeInTheDocument();

    // After chart settles, only h1 should start
    await waitFor(() => {
      expect(kpiFetchOrder).toEqual(["series", "h1"]);
    });

    hypothesisDeferreds[0].resolve(
      createJsonResponse({
        hypothesis: {
          p_neg_vs_num_comments: { n: 250, spearman_rho: 0.35, spearman_p: "< 0.001" },
          p_neg_vs_upvote_ratio: { spearman_rho: -0.2, spearman_p: "= 0.02" },
        },
      }),
    );

    const h1Panel = screen.getByRole("tabpanel", { name: "Hypothesis 1" });
    expect(await within(h1Panel).findByText("HYPOTHESIS PASSED")).toBeVisible();
    expect(within(h1Panel).getByText(/Spearman rho = 0\.35/)).toBeVisible();

    // Without switching tabs, h2 starts next (and h3 waits for h2)
    await waitFor(() => {
      expect(kpiFetchOrder).toEqual(["series", "h1", "h2"]);
    });

    hypothesisDeferreds[1].resolve(
      createJsonResponse({
        hypothesis: {
          score_vs_polarity_magnitude: { n: 250, spearman_rho: -0.1, spearman_p: "= 0.50" },
        },
      }),
    );

    // Still on H1 tab, h3 automatically starts after h2 settles
    await waitFor(() => {
      expect(kpiFetchOrder).toEqual(["series", "h1", "h2", "h3"]);
    });

    // Switch to H2 and confirm H2 result renders while H1 remains mounted in DOM (no unmountOnExit)
    fireEvent.click(screen.getByRole("tab", { name: "Hypothesis 2" }));
    const h2Panel = await screen.findByRole("tabpanel", { name: "Hypothesis 2" });
    expect(await within(h2Panel).findByText("HYPOTHESIS NOT PASSED")).toBeVisible();
    expect(within(h2Panel).getByText(/Spearman rho = -0\.1/)).toBeVisible();
    expect(within(h1Panel).getByText(/Spearman rho = 0\.35/)).toBeInTheDocument();

    // Resolve remaining hypotheses one by one and confirm sequential ordering through h7
    for (let i = 2; i < 7; i++) {
      hypothesisDeferreds[i].resolve(createJsonResponse({ hypothesis: {} }));
      if (i + 1 < 7) {
        const expected = ["series", ...Array.from({ length: i + 2 }, (_, idx) => `h${idx + 1}`)];
        await waitFor(() => {
          expect(kpiFetchOrder).toEqual(expected);
        });
      }
    }

    expect(kpiFetchOrder).toEqual(["series", "h1", "h2", "h3", "h4", "h5", "h6", "h7"]);
  });

  it("handles null, missing hypothesis payloads, and server errors gracefully on hypothesis tabs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/subreddits/sentiments/frequency")) {
          return Promise.resolve(createJsonResponse({ labels: [], metrics: {} }));
        }
        if (url.includes("/kpis/series")) {
          return Promise.resolve(
            createJsonResponse({
              summary: { total_analyzed_posts: 0 },
              time_series: [],
            }),
          );
        }
        if (url.includes("/kpis/h1")) {
          return Promise.resolve(createJsonResponse(null));
        }
        if (url.includes("/kpis/h2")) {
          return Promise.resolve(createJsonResponse({ detail: "Database timeout" }, 500));
        }
        if (url.includes("/kpis/h3")) {
          return Promise.resolve(createJsonResponse({}));
        }
        return Promise.resolve(createJsonResponse({}));
      }),
    );

    renderDataTabs();
    fireEvent.click(screen.getByRole("tab", { name: "KPIs" }));

    const h1Panel = await screen.findByRole("tabpanel", { name: "Hypothesis 1" });
    expect(await within(h1Panel).findByText("No h1 data available.")).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: "Hypothesis 2" }));
    const h2Panel = await screen.findByRole("tabpanel", { name: "Hypothesis 2" });
    await waitFor(() => {
      expect(within(h2Panel).getByText("Error loading h2: Database timeout")).toBeVisible();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Hypothesis 3" }));
    const h3Panel = await screen.findByRole("tabpanel", { name: "Hypothesis 3" });
    expect(await within(h3Panel).findByText("HYPOTHESIS NOT PASSED")).toBeVisible();
  });
});
