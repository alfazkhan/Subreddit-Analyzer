import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Box,
  Heading,
  Text,
  Flex,
  HStack,
  Badge,
  Button,
  Center,
  Spinner,
} from "@chakra-ui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
import DateSelector from "@/components/ui-components/DateSelector";
import type { HourlyPostFrequencyResponse, SubredditAnalyticsProps } from "@/util/Types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const getTodayISODate = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function PostsFrequency({ subreddit = "All" }: SubredditAnalyticsProps) {
  const [activeStart, setActiveStart] = useState("2026-01-01");
  const [activeEnd, setActiveEnd] = useState(getTodayISODate());

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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  const handleAllTime = () => {
    setActiveStart("");
    setActiveEnd("");
  };

  const labels =
    data?.labels ||
    Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const postVolumes = data?.metrics?.post_volumes || Array(24).fill(0);
  const totalPosts = postVolumes.reduce((sum, val) => sum + val, 0);

  const chartData = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          label: "Submissions",
          data: postVolumes,
          fill: true,
          borderColor: "#dd6b20",
          backgroundColor: "rgba(221, 107, 32, 0.15)",
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#dd6b20",
        },
      ],
    };
  }, [labels, postVolumes]);

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `Local Civic Hour: ${items[0].label}`,
            label: (context) =>
              ` Submissions: ${(context.parsed.y ?? 0).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          border: { display: true, color: "rgba(255,255,255,0.1)" },
          grid: { display: true, color: "rgba(255,255,255,0.05)" },
          ticks: { color: "rgba(255,255,255,0.6)", font: { size: 11 } },
        },
        y: {
          border: { display: false },
          beginAtZero: true,
          grid: { color: "rgba(255,255,255,0.08)" },
          ticks: {
            stepSize: 1,
            color: "rgba(255,255,255,0.6)",
            font: { size: 11 },
          },
        },
      },
    }),
    []
  );

  return (
    <Box
      p={6}
      bg="blackAlpha.400"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      position="relative"
    >
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        mb={6}
        wrap="wrap"
        gap={4}
      >
        <Box>
          <HStack gap={3}>
            <Heading size="md" color="orange.400">
              Posting Volume Throughout Day
            </Heading>
            <Badge colorPalette="orange" variant="solid" fontSize="2xs">
              Local Timezone Synchronized
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.400" mt={1}>
            Hourly submissions mapped to city clocks (00:00–23:00) | Analyzed Volume: {totalPosts.toLocaleString()} posts
          </Text>
        </Box>

        <HStack gap={4} wrap="wrap" alignItems="flex-start">
          <Button
            size="sm"
            mt={5}
            variant={!activeStart && !activeEnd ? "solid" : "outline"}
            colorPalette="orange"
            onClick={handleAllTime}
          >
            All Time
          </Button>

          <DateSelector
            start={activeStart}
            end={activeEnd}
            onChange={(s, e) => {
              setActiveStart(s);
              setActiveEnd(e);
            }}
          />
        </HStack>
      </Flex>

      <Box height="350px" width="full">
        {isLoading ? (
          <Center height="100%">
            <Spinner size="xl" color="orange.500" />
          </Center>
        ) : isError ? (
          <Center height="100%">
            <Text color="red.400" fontSize="sm">
              Error fetching post frequency: {error?.message || "Server Error"}
            </Text>
          </Center>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </Box>

      {activeStart && activeEnd && (
        <Badge variant="surface" mt={4} colorPalette="orange">
          Range: {activeStart} to {activeEnd}
        </Badge>
      )}
    </Box>
  );
}