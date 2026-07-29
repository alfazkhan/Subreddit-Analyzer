import { useEffect, useState, useMemo } from "react";
import {
  VStack,
  HStack,
  Box,
  Text,
  Checkbox,
  Flex,
  Spinner,
  Center,
  Badge,
  Button,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchingData } from "@/util/http.js";
import { useSelector } from "react-redux";
import DateSelector from "@/components/ui-components/DateSelector.jsx";

// KPI definitions with color palette matching your dark theme dashboard
const KPI_CONFIG = [
  { key: "ESI", label: "Economic Sentiment (ESI)", color: "#FF9900" }, // Orange
  { key: "ISI", label: "Infrastructure & Services (ISI)", color: "#319795" }, // Teal
  { key: "CII", label: "Consumer Intent (CII)", color: "#38A169" }, // Green
  { key: "CCI", label: "Community Concern & Safety (CCI)", color: "#E53E3E" }, // Red
  { key: "EII", label: "Expat & Integration (EII)", color: "#3182CE" }, // Blue
];

// Native local ISO date helper
const getTodayISODate = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function KPIAnalyticsChart() {
  const subredditId = useSelector((state) => state.userInputState.subredditID);
  const subredditName = useSelector(
    (state) => state.userInputState.subredditName,
  );

  const currentName = useMemo(() => subredditName, [subredditId]);

  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(getTodayISODate());
  const [granularity, setGranularity] = useState("daily");

  const [selectedKPIs, setSelectedKPIs] = useState(["ESI", "CCI"]);

  const endpoint = `kpis/${subredditId}?start_date=${startDate}&end_date=${endDate}&granularity=${granularity}`;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["kpi-analytics", subredditId, startDate, endDate, granularity],
    queryFn: () => fetchingData({ endpoint }),
    enabled: subredditId !== -1 && !!startDate && !!endDate,
  });

  const handleKPIToggle = (kpiKey) => {
    setSelectedKPIs((prev) =>
      prev.includes(kpiKey)
        ? prev.filter((key) => key !== kpiKey)
        : [...prev, kpiKey],
    );
  };

  const handleDateChange = (newStart, newEnd) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const timeSeriesData = data?.time_series || [];

  return (
    <VStack
      width="100%"
      align="stretch"
      bg="blackAlpha.900"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      p={5}
      borderRadius="md"
      gap={4}
    >
      {/* Top Controls & Header */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
        <VStack align="start" gap={0}>
          <Text fontSize="lg" fontWeight="bold" color="orange.400">
            KPI Sentiment Analytics — {currentName || "Select Subreddit"}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Granularity: {granularity.toUpperCase()}
          </Text>
        </VStack>

        {/* Date Selector Integration */}
        <DateSelector
          start={startDate}
          end={endDate}
          onChange={handleDateChange}
        />
      </Flex>

      {/* Granularity & Range Display Bar */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        <HStack gap={2}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold">
            Aggregation:
          </Text>
          {["daily", "weekly", "monthly"].map((gran) => (
            <Button
              key={gran}
              size="xs"
              variant={granularity === gran ? "solid" : "outline"}
              colorScheme="orange"
              onClick={() => setGranularity(gran)}
            >
              {gran.charAt(0).toUpperCase() + gran.slice(1)}
            </Button>
          ))}
        </HStack>

        <Badge colorScheme="orange" variant="outline" p={1} fontSize="xs">
          Range: {startDate} to {endDate}
        </Badge>
      </Flex>

      {/* KPI Selection Checkboxes */}
      <Flex
        wrap="wrap"
        gap={4}
        p={3}
        bg="whiteAlpha.50"
        borderRadius="sm"
        borderColor="whiteAlpha.200"
        borderWidth="1px"
      >
        {KPI_CONFIG.map((kpi) => {
          const isChecked = selectedKPIs.includes(kpi.key);
          return (
            <Checkbox.Root
              key={kpi.key}
              checked={isChecked}
              onCheckedChange={() => handleKPIToggle(kpi.key)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control borderColor={kpi.color} />
              <Checkbox.Label
                fontSize="sm"
                fontWeight="semibold"
                color={isChecked ? kpi.color : "gray.400"}
              >
                {kpi.label}
              </Checkbox.Label>
            </Checkbox.Root>
          );
        })}
      </Flex>

      {/* Chart Body Container */}
      <Box height="400px" width="100%" pt={4}>
        {isLoading ? (
          <Center height="100%">
            <VStack gap={2}>
              <Spinner color="orange.500" size="xl" />
              <Text fontSize="sm" color="gray.400">
                Fetching KPI time-series metrics...
              </Text>
            </VStack>
          </Center>
        ) : isError ? (
          <Center height="100%">
            <Text color="red.400" fontSize="sm">
              Error loading analytics:{" "}
              {error?.message || "Internal Server Error"}
            </Text>
          </Center>
        ) : timeSeriesData.length === 0 ? (
          <Center height="100%">
            <Text color="gray.500">
              No analyzed posts found for the selected date range.
            </Text>
          </Center>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeriesData}
              margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="1 1"
                stroke="rgba(255, 255, 255, 0.08)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                stroke="#718096"
                fontSize={11}
                tickLine={false}
              />

              <YAxis
                domain={[0, 100]}
                stroke="#718096"
                fontSize={11}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A202C",
                  borderColor: "#4A5568",
                  borderRadius: "4px",
                  color: "#FFF",
                  fontSize: "12px",
                }}
              />

              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />

              {KPI_CONFIG.map(
                (kpi) =>
                  selectedKPIs.includes(kpi.key) && (
                    <Line
                      key={kpi.key}
                      type="monotone"
                      dataKey={kpi.key}
                      name={kpi.label}
                      stroke={kpi.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: kpi.color }}
                      activeDot={{ r: 6 }}
                    />
                  ),
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </VStack>
  );
}
