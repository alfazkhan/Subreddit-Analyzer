import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import KPIAnalyticsChart from "./KPIAnalyticsChart";

vi.mock("react-echarts-library", () => {
  return {
    __esModule: true,
    default: vi.fn((props) => {
      return (
        <div data-testid="echarts-mock" data-option={JSON.stringify(props.option)}>
          ECharts Mock
        </div>
      );
    }),
  };
});

describe("KPIAnalyticsChart", () => {
  afterEach(() => {
    cleanup();
  });

  const mockTimeSeriesData = [
    {
      date: "2026-01-01",
      post_count: 100,
      avg_negative_sentiment: 0.12,
      avg_neg_sentiment_SMA: 0.15,
      avg_upvote_ratio: 0.85,
      avg_upvote_ratio_SMA: 0.88,
      avg_score: 50,
      avg_num_comments: 10,
    },
    {
      date: "2026-01-02",
      post_count: 150,
      avg_negative_sentiment: 0.2,
      avg_neg_sentiment_SMA: 0.18,
      avg_upvote_ratio: 0.8,
      avg_upvote_ratio_SMA: 0.82,
      avg_score: 75,
      avg_num_comments: 15,
    },
  ];

  it("renders correctly and passes options with Post Volume bar and line series", () => {
    const { getByTestId } = render(
      <KPIAnalyticsChart
        timeSeriesData={mockTimeSeriesData}
        selectedMetrics={["avg_negative_sentiment", "avg_upvote_ratio", "avg_score", "avg_num_comments"]}
        useSMA={false}
        dynamicYAxis={false}
      />
    );

    const chartElem = getByTestId("echarts-mock");
    expect(chartElem).toBeInTheDocument();

    const option = JSON.parse(chartElem.getAttribute("data-option") || "{}");
    expect(option.xAxis.data).toEqual(["2026-01-01", "2026-01-02"]);

    // Left axis is [0, 1] when dynamicYAxis is false
    expect(option.yAxis[0].min).toBe(0);
    expect(option.yAxis[0].max).toBe(1);
    expect(option.yAxis[0].scale).toBe(false);

    // Right axis starts at 0 when dynamicYAxis is false
    expect(option.yAxis[1].min).toBe(0);
    expect(option.yAxis[1].scale).toBe(false);

    // Verify series: 1 bar series + 4 line series
    expect(option.series).toHaveLength(5);
    expect(option.series[0].name).toBe("Post Volume (N)");
    expect(option.series[0].type).toBe("bar");
    expect(option.series[0].data).toEqual([100, 150]);

    // Raw keys used when useSMA is false
    const negSentimentSeries = option.series.find(
      (s: { name: string }) => s.name === "Negative Sentiment (Pneg)"
    );
    expect(negSentimentSeries).toBeDefined();
    expect(negSentimentSeries.data).toEqual([0.12, 0.2]);
  });

  it("switches to SMA values when useSMA is true", () => {
    const { getByTestId } = render(
      <KPIAnalyticsChart
        timeSeriesData={mockTimeSeriesData}
        selectedMetrics={["avg_negative_sentiment"]}
        useSMA={true}
        dynamicYAxis={false}
      />
    );

    const chartElem = getByTestId("echarts-mock");
    const option = JSON.parse(chartElem.getAttribute("data-option") || "{}");

    // Only 1 bar + 1 selected metric
    expect(option.series).toHaveLength(2);
    const negSentimentSeries = option.series.find(
      (s: { name: string }) => s.name === "Negative Sentiment (Pneg)"
    );
    expect(negSentimentSeries.data).toEqual([0.15, 0.18]);
  });

  it("enables dynamic scaling when dynamicYAxis is true", () => {
    const { getByTestId } = render(
      <KPIAnalyticsChart
        timeSeriesData={mockTimeSeriesData}
        selectedMetrics={["avg_negative_sentiment"]}
        useSMA={false}
        dynamicYAxis={true}
      />
    );

    const chartElem = getByTestId("echarts-mock");
    const option = JSON.parse(chartElem.getAttribute("data-option") || "{}");

    expect(option.yAxis[0].scale).toBe(true);
    expect(option.yAxis[0].min).toBeUndefined();
    expect(option.yAxis[0].max).toBeUndefined();

    expect(option.yAxis[1].scale).toBe(true);
    expect(option.yAxis[1].min).toBeUndefined();
  });

  it("only displays series that are included in selectedMetrics", () => {
    const { getByTestId } = render(
      <KPIAnalyticsChart
        timeSeriesData={mockTimeSeriesData}
        selectedMetrics={["avg_score"]}
        useSMA={false}
        dynamicYAxis={false}
      />
    );

    const chartElem = getByTestId("echarts-mock");
    const option = JSON.parse(chartElem.getAttribute("data-option") || "{}");

    // 1 bar + 1 selected metric (avg_score)
    expect(option.series).toHaveLength(2);
    expect(option.series[0].name).toBe("Post Volume (N)");
    expect(option.series[1].name).toBe("Avg Score (Karma)");
    expect(option.series[1].data).toEqual([50, 75]);
  });

  it("handles empty timeSeriesData gracefully", () => {
    const { getByTestId } = render(
      <KPIAnalyticsChart
        timeSeriesData={[]}
        selectedMetrics={["avg_score"]}
        useSMA={false}
        dynamicYAxis={false}
      />
    );

    const chartElem = getByTestId("echarts-mock");
    const option = JSON.parse(chartElem.getAttribute("data-option") || "{}");

    expect(option.xAxis.data).toEqual([]);
    expect(option.series[0].data).toEqual([]);
  });
});
