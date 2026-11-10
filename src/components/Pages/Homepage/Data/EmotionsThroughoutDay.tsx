import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/api";
import { getYearStartToToday } from "@/util/dateTime";
import {
  calculateDynamicGridInterval,
  createHourlyLineChartOption,
  createHourlyLineSeries,
  getDefaultHourlyLabels,
} from "@/util/analytics";
import TimeSeriesChartCard from "@/components/ui-components/TimeSeriesChartCard";
import type { HourlySentimentFrequencyResponse, SubredditAnalyticsProps } from "@/util/Types";

export default function EmotionsThroughoutDay({ subreddit = "All" }: SubredditAnalyticsProps) {
  const defaultDates = useMemo(() => getYearStartToToday(), []);

  const [activeStart, setActiveStart] = useState(defaultDates.start);
  const [activeEnd, setActiveEnd] = useState(defaultDates.end);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (subreddit && subreddit !== "All") params.append("subreddit", subreddit);
    if (activeStart) params.append("start_date", activeStart);
    if (activeEnd) params.append("end_date", activeEnd);
    return `subreddits/sentiments/frequency?${params.toString()}`;
  }, [subreddit, activeStart, activeEnd]);

  const { data, isLoading, isError, error } = useQuery<HourlySentimentFrequencyResponse>({
    queryKey: ["diurnal-sentiments", subreddit, activeStart, activeEnd],
    queryFn: ({ signal }) => fetchingData({ endpoint, signal }),
  });

  const handleAllTime = () => {
    setActiveStart("");
    setActiveEnd("");
  };

  const labels = data?.labels || getDefaultHourlyLabels();
  const positiveData = useMemo(() => data?.metrics?.positive_counts || Array(24).fill(0), [data]);
  const negativeData = useMemo(() => data?.metrics?.negative_counts || Array(24).fill(0), [data]);
  const postVolumes = data?.metrics?.post_volumes || Array(24).fill(0);

  const dynamicInterval = calculateDynamicGridInterval([...positiveData, ...negativeData]);

  const option = useMemo(
    () =>
      createHourlyLineChartOption({
        labels,
        interval: dynamicInterval,
        legend: {
          show: true,
          top: 0,
          textStyle: {
            color: "#E2E8F0",
            fontSize: 12,
          },
        },
        tooltip: {
          trigger: "axis",
          textStyle: {
            fontSize: 10,
          },
          formatter: (params: unknown) => {
            const items = (Array.isArray(params) ? params : [params]) as Array<{
              axisValue?: string;
              dataIndex?: number;
              marker?: string;
              seriesName?: string;
              value?: number;
            }>;
            const hour = items[0]?.axisValue || "";
            const index = items[0]?.dataIndex ?? 0;
            const volume = postVolumes[index] || 0;
            let html = `<div style="font-weight:600">Local Civic Hour: ${hour}</div>`;
            for (const item of items) {
              html += `<div>${item.marker ?? ""} ${item.seriesName ?? ""}: <strong>${item.value ?? 0}</strong></div>`;
            }
            html += `<div style="margin-top:4px;color:#999">Total Submissions: ${volume.toLocaleString()}</div>`;
            return html;
          },
        },
        series: [
          createHourlyLineSeries({ name: "Positive Post", data: positiveData, color: "#22c55e" }),
          createHourlyLineSeries({ name: "Negative Post", data: negativeData, color: "#ef4444" }),
        ],
      }),
    [positiveData, negativeData, labels, postVolumes, dynamicInterval],
  );

  return (
    <TimeSeriesChartCard
      title="Diurnal Affect Cycles"
      subtitle="Combined average rhythms mapped to local city clocks (00:00–23:00)"
      startDate={activeStart}
      endDate={activeEnd}
      onDateChange={(s, e) => {
        setActiveStart(s);
        setActiveEnd(e);
      }}
      onAllTime={handleAllTime}
      isLoading={isLoading}
      isError={isError}
      error={error}
      errorPrefix="Error loading diurnal frequency"
      option={option}
      chartHeight="360px"
    />
  );
}
