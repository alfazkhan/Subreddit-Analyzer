import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { 
  Box, Heading, Text, Flex, HStack, 
  Field, Select, Input, Badge 
} from "@chakra-ui/react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  Tooltip, Legend, Filler
);

export default function PostTime({ data }) {
  // --- State ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // --- Timezone Options ---
  const tzOptions = [
    { label: "My Local Time", value: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { label: "India (IST)", value: "Asia/Kolkata" },
    { label: "Germany (CEST)", value: "Europe/Berlin" },
    { label: "UTC", value: "UTC" },
  ];

  // --- Data Processing ---
  const hourlyData = useMemo(() => {
    const counts = Array(24).fill(0);
    
    data.forEach((post) => {
      if (!post.timestamp) return;
      
      const dateObj = new Date(post.timestamp);

      // 1. Get the local date and hour for the CHOSEN timezone
      const localDate = dateObj.toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
      const localHour = parseInt(
        dateObj.toLocaleString("en-US", { 
          hour: "numeric", 
          hour12: false, 
          timeZone: timezone 
        })
      ) % 24;

      // 2. Filter by Date Range
      // If no dates are selected, show all. Otherwise, check range.
      const isAfterStart = !startDate || localDate >= startDate;
      const isBeforeEnd = !endDate || localDate <= endDate;

      if (isAfterStart && isBeforeEnd) {
        counts[localHour]++;
      }
    });

    return counts;
  }, [data, startDate, endDate, timezone]);

  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  const chartData = {
    labels,
    datasets: [{
      label: "Post Count",
      data: hourlyData,
      fill: true,
      borderColor: "#dd6b20",
      backgroundColor: "rgba(221, 107, 32, 0.1)",
      tension: 0.4,
      pointRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => `Time: ${items[0].label} (${timezone})`,
        }
      }
    },
    scales: {
      x: { ticks: { color: "rgba(255,255,255,0.5)" }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1, color: "rgba(255,255,255,0.5)" } }
    }
  };

  return (
    <Box p={6} bg="blackAlpha.400" borderRadius="xl" borderWidth="1px" borderColor="whiteAlpha.200">
      <Flex justifyContent="space-between" alignItems="flex-start" mb={6} wrap="wrap" gap={4}>
        <Box>
          <Heading size="md" color="orange.600">Time Distribution</Heading>
          <Text fontSize="xs" color="whiteAlpha.500">Currently showing: {timezone}</Text>
        </Box>

        <HStack gap={4} wrap="wrap">
          <Field.Root width="auto">
            <Field.Label fontSize="xs">Timezone</Field.Label>
            <select 
              value={timezone} 
              onChange={(e) => setTimezone(e.target.value)}
              style={{ background: "#1A202C", color: "white", padding: "4px", borderRadius: "4px" }}
            >
              {tzOptions.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
            </select>
          </Field.Root>

          <Field.Root width="auto">
            <Field.Label fontSize="xs">From</Field.Label>
            <Input size="sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field.Root>

          <Field.Root width="auto">
            <Field.Label fontSize="xs">To</Field.Label>
            <Input size="sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field.Root>
        </HStack>
      </Flex>

      <Box height="350px">
        <Line data={chartData} options={options} />
      </Box>
      
      {startDate && endDate && (
        <Badge variant="surface" mt={4} colorPalette="orange">
          Aggregating Data from {startDate} to {endDate}
        </Badge>
      )}
    </Box>
  );
}