import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
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
  Spinner,
  Center,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
import DateSelector from "@/components/ui-components/DateSelector";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export default function EmotionsThroughoutDay({ subreddit = "All" }) {
  const defaultDates = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startStr = `${currentYear}-01-01`;
    const endStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return { start: startStr, end: endStr };
  }, []);

  const [activeStart, setActiveStart] = useState(defaultDates.start);
  const [activeEnd, setActiveEnd] = useState(defaultDates.end);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (subreddit && subreddit !== "All") params.append("subreddit", subreddit);
    if (activeStart) params.append("start_date", activeStart);
    if (activeEnd) params.append("end_date", activeEnd);
    return `subreddits/sentiments/frequency?${params.toString()}`;
  }, [subreddit, activeStart, activeEnd]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["diurnal-sentiments", subreddit, activeStart, activeEnd],
    queryFn: ({ signal }) => fetchingData({ endpoint, signal }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  const handleAllTime = () => {
    setActiveStart("");
    setActiveEnd("");
  };

  const labels = data?.labels || Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const positiveData = data?.metrics?.positive_counts || Array(24).fill(0);
  const negativeData = data?.metrics?.negative_counts || Array(24).fill(0);
  const postVolumes = data?.metrics?.post_volumes || Array(24).fill(0);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Positive Emotion",
        data: positiveData,
        borderColor: "#dd6b20",
        backgroundColor: "rgba(221, 107, 32, 0.15)",
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: "Negative Emotion",
        data: negativeData,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#E2E8F0",
          font: { size: 12 },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (items) => `Local Civic Hour: ${items[0].label}`,
          afterBody: (items) => {
            const index = items[0].dataIndex;
            const volume = postVolumes[index] || 0;
            return `Total Submissions: ${volume.toLocaleString()}`;
          },
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
        grid: { color: "rgba(255,255,255,0.08)" },
        beginAtZero: true,
        ticks: { color: "rgba(255,255,255,0.6)", font: { size: 11 } },
      },
    },
  };

  return (
    <Box p={6} bg="blackAlpha.400" borderRadius="xl" borderWidth="1px" borderColor="whiteAlpha.200">
      <Flex justifyContent="space-between" alignItems="flex-start" mb={6} wrap="wrap" gap={4}>
        <Box>
          <HStack gap={3}>
            <Heading size="md" color="orange.400">
              Diurnal Affect Cycles
            </Heading>
            <Badge colorPalette="orange" variant="solid" fontSize="2xs">
              Local Timezone Synchronized
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.400" mt={1}>
            Combined average rhythms mapped to local city clocks (00:00–23:00)
          </Text>
        </Box>

        <HStack gap={4} wrap="wrap" alignItems="flex-start">
          <Button
            type="button"
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

      <Box height="360px" width="full">
        {isLoading ? (
          <Center height="100%">
            <Spinner color="orange.500" size="xl" />
          </Center>
        ) : isError ? (
          <Center height="100%">
            <Text color="red.400" fontSize="sm">
              Error loading diurnal frequency: {error?.message || "Internal Server Error"}
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