import { useState, useMemo, useEffect } from "react";
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
  Switch,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchingData } from "@/util/http.js";
import { useSelector } from "react-redux";
import DateSelector from "@/components/ui-components/DateSelector.jsx";

const KPI_CONFIG = [
  { key: "ESI", label: "Economic Sentiment (ESI)", color: "#FF9900" },
  { key: "ISI", label: "Infrastructure & Services (ISI)", color: "#319795" },
  { key: "CII", label: "Consumer Intent (CII)", color: "#38A169" },
  { key: "CCI", label: "Community Concern & Safety (CCI)", color: "#E53E3E" },
  { key: "EII", label: "Expat & Integration (EII)", color: "#3182CE" },
];

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

  const [useSMA, setUseSMA] = useState(true);
  const [dynamicYAxis, setDynamicYAxis] = useState(false);

  const [selectedKPIs, setSelectedKPIs] = useState(["ESI", "CCI"]);

  const endpoint = `kpis/${subredditId}?start_date=${startDate}&end_date=${endDate}&granularity=${granularity}&sma_window=7`;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "kpi-analytics",
      subredditId,
      startDate,
      endDate,
      granularity,
      useSMA,
    ],
    queryFn: () => fetchingData({ endpoint }),
    enabled: subredditId !== -1 && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

    useEffect(() => {
    console.log("Rendered");
  }, []);

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
  const summary = data?.summary || {};

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

        <HStack gap={4}>
          <HStack gap={1}>
            <Text fontSize="xs" color="gray.400">
              7D SMA Smoothing
            </Text>
            <Switch.Root
              size="sm"
              checked={useSMA}
              onCheckedChange={(e) => setUseSMA(!!e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control />
            </Switch.Root>
          </HStack>

          <HStack gap={1}>
            <Text fontSize="xs" color="gray.400">
              Dynamic Y-Axis Zoom
            </Text>
            <Switch.Root
              size="sm"
              checked={dynamicYAxis}
              onCheckedChange={(e) => setDynamicYAxis(!!e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control />
            </Switch.Root>
          </HStack>

          <Badge colorScheme="orange" variant="outline" p={1} fontSize="xs">
            Range: {startDate} to {endDate}
          </Badge>
        </HStack>
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
      <Box height="420px" width="100%" pt={2}>
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
            <ComposedChart
              data={timeSeriesData}
              margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="1 1"
                stroke="rgba(255, 255, 255, 0.08)"
                vertical={false}
              />

              {/* Fix Overlapping Date Labels on X-Axis */}
              <XAxis
                dataKey="date"
                stroke="#718096"
                fontSize={11}
                tickLine={false}
                minTickGap={35}
                interval="preserveStartEnd"
              />

              <YAxis
                yAxisId="left"
                domain={dynamicYAxis ? ["auto", "auto"] : [0, 100]}
                stroke="#718096"
                fontSize={11}
                tickLine={false}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#4A5568"
                fontSize={10}
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

              <Bar
                yAxisId="right"
                dataKey="total_posts"
                name="Post Volume (N)"
                fill="rgba(255, 255, 255, 0.08)"
                barSize={12}
              />

              {KPI_CONFIG.map((kpi) => {
                if (!selectedKPIs.includes(kpi.key)) return null;
                const dataKey = useSMA ? `${kpi.key}_SMA` : kpi.key;
                return (
                  <Line
                    key={kpi.key}
                    yAxisId="left"
                    type="monotone"
                    dataKey={dataKey}
                    name={useSMA ? `${kpi.label} (7D SMA)` : kpi.label}
                    stroke={kpi.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Box>

      {/* Executive Statistical Summary Cards Panel with p-values */}
      <Grid templateColumns="repeat(4, 1fr)" gap={4} pt={2}>
        <GridItem
          bg="whiteAlpha.50"
          p={3}
          borderRadius="md"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <Text fontSize="xs" color="gray.400">
            Total Sample Size
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="white">
            {summary.total_analyzed_posts || 0} Posts
          </Text>
        </GridItem>

        <GridItem
          bg="whiteAlpha.50"
          p={3}
          borderRadius="md"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <Text fontSize="xs" color="gray.400">
            Mean ESI / Mean CCI
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="orange.400">
            {summary.mean_ESI || 0} / {summary.mean_CCI || 0}
          </Text>
        </GridItem>

        <GridItem
          bg="whiteAlpha.50"
          p={3}
          borderRadius="md"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <Text fontSize="xs" color="gray.400">
            H1 Pearson r (ESI vs CCI)
          </Text>
          <Text
            fontSize="md"
            fontWeight="bold"
            color={summary.overall_r_ESI_CCI < 0 ? "red.400" : "green.400"}
          >
            r = {summary.overall_r_ESI_CCI ?? "N/A"}{" "}
            <Text as="span" fontSize="xs" color="gray.400" fontWeight="normal">
              (p {summary.overall_p_ESI_CCI ?? "N/A"})
            </Text>
          </Text>
        </GridItem>

        <GridItem
          bg="whiteAlpha.50"
          p={3}
          borderRadius="md"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <Text fontSize="xs" color="gray.400">
            H2 Pearson r (EII vs CII)
          </Text>
          <Text
            fontSize="md"
            fontWeight="bold"
            color={summary.overall_r_EII_CII > 0 ? "green.400" : "red.400"}
          >
            r = {summary.overall_r_EII_CII ?? "N/A"}{" "}
            <Text as="span" fontSize="xs" color="gray.400" fontWeight="normal">
              (p {summary.overall_p_EII_CII ?? "N/A"})
            </Text>
          </Text>
        </GridItem>
      </Grid>
    </VStack>
  );
}
