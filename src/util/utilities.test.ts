import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMinLengthFilterFn,
  findMinMax,
  getColorPalette,
  getRedditPostUrl,
  getTopKeywords,
  keywordCount,
  mergeQueueCounts,
  paginationDataSlicer,
  stringToColor,
  toggleArrayItem,
} from "./data";
import {
  dateTimeFormatter,
  formatTime,
  getLocalISODate,
  getYearStartToToday,
  parseTimezones,
} from "./dateTime";
import {
  asRecord,
  calculateDynamicGridInterval,
  createHourlyLineChartOption,
  createHourlyLineSeries,
  formatHypothesisResult,
  formatStatValue,
  getDefaultHourlyLabels,
  getHypothesisStats,
  isHypothesisPassed,
} from "./analytics";
import {
  DEFAULT_QUERY_GC_TIME,
  DEFAULT_QUERY_OPTIONS,
  DEFAULT_QUERY_STALE_TIME,
  keywordsQueryOptions,
  queryClient,
} from "./api";

vi.mock("firebase/auth", () => ({ onAuthStateChanged: vi.fn() }));
vi.mock("../../firebase_config", () => ({ auth: {} }));

afterEach(() => {
  vi.useRealTimers();
});

describe("dateTime utilities", () => {
  it("formats durations into hours, minutes, and seconds", () => {
    expect(formatTime(0.5)).toBe("Calculating...");
    expect(formatTime(45)).toBe("45s");
    expect(formatTime(3665)).toBe("1h 1m 5s");
  });

  it("formats local ISO dates for explicit and default dates", () => {
    expect(getLocalISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 9, 14, 30));
    expect(getLocalISODate()).toBe("2026-11-09");
  });

  it("formats timestamps with Today/Yesterday labels and handles invalid inputs", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 10, 12, 0));

    expect(dateTimeFormatter(undefined)).toBe("N/A");
    expect(dateTimeFormatter("not-a-date")).toBe("Invalid Date");
    expect(dateTimeFormatter(new Date(2026, 10, 10, 9, 5).toISOString())).toMatch(
      /^Today at /,
    );
    expect(dateTimeFormatter(new Date(2026, 10, 9, 18, 15).toISOString())).toMatch(
      /^Yesterday at /,
    );
    expect(dateTimeFormatter(new Date(2026, 0, 15, 8, 30).toISOString())).toMatch(
      /^15\/01\/2026 /,
    );
  });

  it("parses IANA timezones grouped by region", () => {
    expect(
      parseTimezones(["Europe/Berlin", "America/New_York", "UTC", "Europe/London"]),
    ).toEqual({
      Europe: ["Berlin", "London"],
      America: ["New_York"],
    });
  });

  it("returns Jan 1 of the current year through today", () => {
    expect(getYearStartToToday(new Date(2026, 10, 10))).toEqual({
      start: "2026-01-01",
      end: "2026-11-10",
    });
  });
});

describe("colors utilities", () => {
  it("generates deterministic HSL colors from strings", () => {
    const color = stringToColor("berlin");
    expect(color).toMatch(/^hsl\(\d+, 70%, 50%\)$/);
    expect(stringToColor("berlin")).toBe(color);
  });

  it("maps password strength percentages to color palettes", () => {
    expect(getColorPalette(10)).toEqual({ label: "Low", colorPalette: "red" });
    expect(getColorPalette(50)).toEqual({ label: "Medium", colorPalette: "orange" });
    expect(getColorPalette(80)).toEqual({ label: "High", colorPalette: "green" });
  });
});

describe("data utilities", () => {
  it("counts keywords across posts while skipping numeric keys", () => {
    expect(
      keywordCount([
        { keywords: JSON.stringify({ rent: 1, "123": 1, transit: 2 }) },
        { keywords: JSON.stringify({ rent: 3 }) },
        {},
      ]),
    ).toEqual({ rent: 2, transit: 1 });
  });

  it("computes min and max frequency bounds for top keywords", () => {
    const setMin = vi.fn();
    const setMax = vi.fn();
    getTopKeywords({ a: 2, b: 10, c: 25, d: 50 }, 2, setMin, setMax);
    expect(setMin).toHaveBeenCalledWith(25);
    expect(setMax).toHaveBeenCalledWith(50);
  });

  it("finds min and max keyword frequencies with fallback bounds", () => {
    expect(findMinMax(undefined)).toEqual([0, 100]);
    expect(findMinMax([])).toEqual([0, 100]);
    expect(findMinMax([{ frequency: 25 }, { frequency: 25 }])).toEqual([0, 25]);
    expect(findMinMax([{ frequency: 5 }, { frequency: 42 }, { frequency: 12 }])).toEqual([
      5, 42,
    ]);
  });

  it("slices arrays for pagination", () => {
    expect(paginationDataSlicer([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
    expect(paginationDataSlicer(undefined, 1, 10)).toBeUndefined();
  });

  it("merges partial queue counts without dropping existing values", () => {
    expect(
      mergeQueueCounts(
        { total: 10, pending: 4, processing: 2, completed: 3, failed: 1 },
        { pending: 2, completed: 5 },
      ),
    ).toEqual({
      total: 10,
      pending: 2,
      processing: 2,
      completed: 5,
      failed: 1,
    });
  });
});

describe("hypothesis utilities", () => {
  it("safely converts values to plain records and formats stat values", () => {
    expect(asRecord(null)).toEqual({});
    expect(asRecord("abc")).toEqual({});
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });

    expect(formatStatValue(null)).toBe("N/A");
    expect(formatStatValue(undefined)).toBe("N/A");
    expect(formatStatValue(0.42)).toBe(0.42);
    expect(formatStatValue(true)).toBe("true");
    expect(formatStatValue({ mean: 1.5 })).toBe('{"mean":1.5}');
  });

  it("extracts hypothesis stats, evaluates pass criteria, and formats summaries", () => {
    const h1Stats = getHypothesisStats("H1", {
      hypothesis: {
        p_neg_vs_num_comments: { n: 120, spearman_rho: 0.35, spearman_p: "< 0.001" },
        p_neg_vs_upvote_ratio: { spearman_rho: -0.2, spearman_p: "= 0.02" },
      },
    });
    expect(h1Stats).toEqual({
      n: 120,
      rhoComments: 0.35,
      pComments: "< 0.001",
      rhoApproval: -0.2,
      pApproval: "= 0.02",
    });
    expect(isHypothesisPassed("H1", h1Stats)).toBe(true);
    expect(formatHypothesisResult("H1", h1Stats)).toContain("Spearman rho = 0.35");

    const h3Stats = getHypothesisStats("H3", {
      hypothesis: {
        statistics: {
          sample_size: 50,
          entropy_coef: -0.4,
          entropy_p_val: "= 0.01",
          r_squared: 0.25,
        },
      },
    });
    expect(isHypothesisPassed("H3", h3Stats)).toBe(true);
    expect(formatHypothesisResult("H3", h3Stats)).toContain("Model R2 = 0.25");
  });
});

describe("shared refactoring helpers", () => {
  it("toggles array items and builds Reddit post URLs", () => {
    expect(toggleArrayItem(["a", "b"], "c", true)).toEqual(["a", "b", "c"]);
    expect(toggleArrayItem(["a", "b"], "b", false)).toEqual(["a"]);
    expect(toggleArrayItem([1, 2], 2)).toEqual([1]);

    expect(getRedditPostUrl("berlin", "t3_abc123")).toBe(
      "https://www.reddit.com/r/berlin/comments/abc123",
    );
  });

  it("creates case-insensitive minimum-length table filters", () => {
    const filterFn = createMinLengthFilterFn<{ name: string }>(3);
    const mockRow = { getValue: () => "Berlin" } as unknown as Parameters<typeof filterFn>[0];

    expect(filterFn(mockRow, "name", "be", vi.fn())).toBe(true);
    expect(filterFn(mockRow, "name", "ber", vi.fn())).toBe(true);
    expect(filterFn(mockRow, "name", "mun", vi.fn())).toBe(false);
  });

  it("builds shared ECharts hourly labels, grid intervals, and line chart options", () => {
    const labels = getDefaultHourlyLabels();
    expect(labels).toHaveLength(24);
    expect(labels[0]).toBe("00:00");
    expect(labels[23]).toBe("23:00");

    expect(calculateDynamicGridInterval([10, 45])).toBe(3);
    expect(calculateDynamicGridInterval([])).toBe(1);

    const series = createHourlyLineSeries({ name: "Posts", data: [1, 2], color: "#dd6b20" });
    const option = createHourlyLineChartOption({
      labels: ["00:00", "01:00"],
      interval: 1,
      series: [series],
      tooltip: { trigger: "axis" },
    });

    expect(option.animationDuration).toBe(1500);
    expect(option.series).toHaveLength(1);
  });

  it("configures shared TanStack Query defaults and keywords query options", () => {
    expect(DEFAULT_QUERY_OPTIONS).toEqual({
      staleTime: DEFAULT_QUERY_STALE_TIME,
      gcTime: DEFAULT_QUERY_GC_TIME,
    });
    expect(queryClient.getDefaultOptions().queries).toMatchObject(DEFAULT_QUERY_OPTIONS);
    expect(keywordsQueryOptions.queryKey).toEqual(["keywords"]);
  });
});
