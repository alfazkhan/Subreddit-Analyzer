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
import type { HourlyPostFrequencyResponse, SubredditAnalyticsProps } from "@/util/Types";

export default function PostsFrequency({ subreddit = "All" }: SubredditAnalyticsProps) {
  const defaultDates = useMemo(() => getYearStartToToday(), []);

  const [activeStart, setActiveStart] = useState(defaultDates.start);
  const [activeEnd, setActiveEnd] = useState(defaultDates.end);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (activeStart) params.append("start_date", activeStart);
    if (activeEnd) params.append("end_date", activeEnd);

    const basePath =
      subreddit && subreddit !== "All"
        ? `posts/frequency/${encodeURIComponent(subreddit)}`
        : "posts/frequency";

    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }, [subreddit, activeStart, activeEnd]);

  const { data, isLoading, isError, error } = useQuery<HourlyPostFrequencyResponse>({
    queryKey: ["posts-frequency", subreddit, activeStart, activeEnd],
    queryFn: ({ signal }) => fetchingData({ endpoint, signal }),
  });

  const handleAllTime = () => {
    setActiveStart("");
    setActiveEnd("");
  };

  const labels = data?.labels || getDefaultHourlyLabels();
  const postVolumes = useMemo(() => data?.metrics?.post_volumes || Array(24).fill(0), [data]);
  const totalPosts = postVolumes.reduce((sum, val) => sum + val, 0);
  const dynamicInterval = calculateDynamicGridInterval(postVolumes);

  const option = useMemo(
    () =>
      createHourlyLineChartOption({
        labels,
        interval: dynamicInterval,
        tooltip: {
          trigger: "axis",
          textStyle: {
            color: "#dd6b20",
            fontSize: 10,
          },
        },
        series: [
          createHourlyLineSeries({ name: "No of posts", data: postVolumes, color: "#dd6b20" }),
        ],
      }),
    [labels, dynamicInterval, postVolumes],
  );

  return (
    <TimeSeriesChartCard
      title="Posting Volume Throughout Day"
      subtitle={`Hourly submissions mapped to city clocks (00:00–23:00) | Analyzed Volume: ${totalPosts.toLocaleString()} posts`}
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
      errorPrefix="Error fetching post frequency"
      option={option}
      chartHeight="350px"
    />
  );
}
