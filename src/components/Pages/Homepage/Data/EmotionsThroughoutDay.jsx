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
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Box,
  Heading,
  Text,
  Flex,
  HStack,
  Field,
  Badge,
  Button,
} from "@chakra-ui/react";
import DateSelector from "@/components/ui-components/DateSelector";
import TimeZoneSelect from "@/components/ui-components/TimeZoneSelect"; 

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export default function EmotionsThroughoutDay({ data: postsData }) {
  const systemTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  
  const defaultDates = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startStr = `${currentYear}-01-01`;
    const endStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return { start: startStr, end: endStr };
  }, []);

  const [activeTz, setActiveTz] = useState(systemTimeZone);
  const [activeStart, setActiveStart] = useState(defaultDates.start);
  const [activeEnd, setActiveEnd] = useState(defaultDates.end);

  const handleAllTime = () => {
    if (!postsData || postsData.length === 0) return;

    const timestamps = postsData
      .map((p) => new Date(p.timestamp).getTime())
      .filter((t) => !isNaN(t));

    if (timestamps.length === 0) return;

    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));

    setActiveStart(minDate.toLocaleDateString("en-CA", { timeZone: activeTz }));
    setActiveEnd(maxDate.toLocaleDateString("en-CA", { timeZone: activeTz }));
  };

  const hourlySentimentData = useMemo(() => {
    const counts = {
      Positive: Array(24).fill(0),
      Neutral: Array(24).fill(0),
      Negative: Array(24).fill(0),
    };

    if (!postsData) return counts;

    postsData.forEach((post) => {
      if (!post.timestamp || !post.sentiment) return;
      if (counts[post.sentiment] === undefined) return; 

      const dateObj = new Date(post.timestamp);
      
      const localDateStr = dateObj.toLocaleDateString("en-CA", { timeZone: activeTz });
      const localHour = parseInt(
        dateObj.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: activeTz })
      ) % 24;

      const isAfterStart = !activeStart || localDateStr >= activeStart;
      const isBeforeEnd = !activeEnd || localDateStr <= activeEnd;

      if (isAfterStart && isBeforeEnd) {
        counts[post.sentiment][localHour]++;
      }
    });

    return counts;
  }, [postsData, activeStart, activeEnd, activeTz]);

  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  
  const chartData = {
    labels,
    datasets: [
      {
        label: "Positive",
        data: hourlySentimentData.Positive,
        borderColor: "#dd6b20",
        backgroundColor: "rgba(221, 107, 32, 0.1)",
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: "Negative",
        data: hourlySentimentData.Negative,
        backgroundColor: "rgb(194, 36, 36)",
        borderColor: "rgb(194, 36, 36)",
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false, 
      },
      tooltip: {
        callbacks: {
          title: (items) => `Time: ${items[0].label} (${activeTz})`,
        },
      },
    },
    scales: {
      x: {
        border: { display: true },
        grid: { display: true, drawOnChartArea: true, drawTicks: true },
        ticks: { color: "rgba(255,255,255,0.5)" },
      },
      y: {
        border: { display: false },
        grid: { color: "rgba(255,255,255,0.1)" },
        beginAtZero: true,
        ticks: { stepSize: 1, color: "rgba(255,255,255,0.5)" },
      },
    },
  };

  return (
    <Box p={6} bg="blackAlpha.400" borderRadius="xl" borderWidth="1px" borderColor="whiteAlpha.200">
      <Flex justifyContent="space-between" alignItems="flex-start" mb={6} wrap="wrap" gap={4}>
        <Box>
          <Heading size="md" color="orange.600">Sentiments Throughout the day</Heading>
          <Text fontSize="xs" color="whiteAlpha.500">Currently showing: {activeTz}</Text>
        </Box>

        <HStack gap={4} wrap="wrap" alignItems="flex-start">
          <Button type="button" size="sm" mt={5} variant="outline" colorPalette="orange" onClick={handleAllTime}>
            All Time
          </Button>

          <Field.Root width="auto" mt={5}>
            <Field.Label fontSize="xs">Timezone</Field.Label>
            <TimeZoneSelect onTimeZoneChange={setActiveTz} currentTimeZone={activeTz} />
          </Field.Root>

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

      <Box height="350px">
        <Line data={chartData} options={options} />
      </Box>

      {activeStart && activeEnd && (
        <Badge variant="surface" mt={4} colorPalette="orange">
          Range: {activeStart} to {activeEnd}
        </Badge>
      )}
    </Box>
  );
}