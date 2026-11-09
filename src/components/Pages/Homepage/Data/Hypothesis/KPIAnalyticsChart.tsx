import { useMemo } from "react";
import EChartsReact from "react-echarts-library";
import type { EChartsOption } from "echarts";
import { KPI_METRICS } from "./kpiMetrics";

export interface KPIAnalyticsChartProps {
  timeSeriesData: Array<Record<string, unknown>>;
  selectedMetrics: string[];
  useSMA: boolean;
  dynamicYAxis: boolean;
}

const METRIC_LABELS: Record<string, string> = {
  avg_negative_sentiment: "Negative Sentiment (Pneg)",
  avg_upvote_ratio: "Upvote Ratio",
  avg_score: "Avg Score (Karma)",
  avg_num_comments: "Avg Comments",
};

export default function KPIAnalyticsChart({
  timeSeriesData,
  selectedMetrics,
  useSMA,
  dynamicYAxis,
}: KPIAnalyticsChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const dates = timeSeriesData.map((item) => String(item.date ?? ""));
    const postCounts = timeSeriesData.map((item) => {
      const val = item.post_count;
      if (val === null || val === undefined || val === "") return 0;
      const num = Number(val);
      return Number.isNaN(num) ? 0 : num;
    });

    const series: EChartsOption["series"] = [
      {
        name: "Post Volume (N)",
        type: "bar",
        yAxisIndex: 1,
        data: postCounts,
        barWidth: 12,
        barMaxWidth: 16,
        itemStyle: {
          color: "rgba(255, 255, 255, 0.08)",
          borderRadius: [2, 2, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: "rgba(255, 255, 255, 0.18)",
          },
        },
        z: 1,
        tooltip: {
          valueFormatter: (value) =>
            value !== null && value !== undefined && value !== ""
              ? Number(value).toLocaleString()
              : "-",
        },
      },
    ];

    KPI_METRICS.forEach((metric) => {
      if (!selectedMetrics.includes(metric.rawKey)) return;
      const fieldKey = useSMA ? metric.smaKey : metric.rawKey;
      const data = timeSeriesData.map((item) => {
        const val = item[fieldKey];
        if (val === null || val === undefined || val === "") return null;
        const num = Number(val);
        return Number.isNaN(num) ? null : num;
      });

      series.push({
        name: METRIC_LABELS[metric.rawKey] ?? metric.rawKey,
        type: "line",
        yAxisIndex: metric.axis === "left" ? 0 : 1,
        data,
        smooth: true,
        showSymbol: false,
        symbol: "circle",
        symbolSize: 8,
        connectNulls: true,
        lineStyle: {
          color: metric.color,
          width: 2.5,
        },
        itemStyle: {
          color: metric.color,
        },
        emphasis: {
          focus: "series",
          lineStyle: {
            width: 3.5,
          },
        },
        z: 3,
        tooltip: {
          valueFormatter: (value) => {
            if (value === null || value === undefined || value === "") return "N/A";
            const num = Number(value);
            if (Number.isNaN(num)) return "N/A";
            return metric.axis === "left"
              ? num.toFixed(3)
              : num.toLocaleString(undefined, { maximumFractionDigits: 1 });
          },
        },
      });
    });

    return {
      backgroundColor: "transparent",
      grid: {
        top: 20,
        right: 25,
        bottom: 45,
        left: 20,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#2D3748",
            color: "#FFF",
            fontSize: 11,
          },
          crossStyle: {
            color: "rgba(255, 255, 255, 0.2)",
            type: "dashed",
          },
          lineStyle: {
            color: "rgba(255, 255, 255, 0.2)",
            type: "dashed",
          },
        },
        backgroundColor: "#1A202C",
        borderColor: "#4A5568",
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
          color: "#FFF",
          fontSize: 13,
        },
        extraCssText: "box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5); border-radius: 6px;",
      },
      legend: {
        bottom: 0,
        textStyle: {
          color: "#A0AEC0",
          fontSize: 12,
        },
        itemGap: 16,
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLine: {
          lineStyle: {
            color: "#A0AEC0",
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: "#A0AEC0",
          fontSize: 12,
          hideOverlap: true,
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: [
        {
          type: "value",
          position: "left",
          scale: dynamicYAxis,
          min: dynamicYAxis ? undefined : 0,
          max: dynamicYAxis ? undefined : 1,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: "#A0AEC0",
            fontSize: 12,
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: "rgba(255, 255, 255, 0.08)",
              type: "dashed",
            },
          },
        },
        {
          type: "value",
          position: "right",
          scale: dynamicYAxis,
          min: dynamicYAxis ? undefined : 0,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: "#A0AEC0",
            fontSize: 12,
            formatter: (val: number) => val.toLocaleString(),
          },
          splitLine: {
            show: false,
          },
        },
      ],
      series,
    };
  }, [timeSeriesData, selectedMetrics, useSMA, dynamicYAxis]);

  return (
    <EChartsReact
      option={option}
      style={{ width: "100%", height: "100%" }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
}
