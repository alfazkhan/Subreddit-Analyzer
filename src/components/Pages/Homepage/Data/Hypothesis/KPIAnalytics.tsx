import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  HStack,
  Progress,
  Spinner,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http.js";
import DateSelector from "@/components/ui-components/DateSelector";
import HypothesisTabs from "./HypothesisTabs";
import KPIAnalyticsChart from "./KPIAnalyticsChart";
import { HYPOTHESIS_TABS } from "./definitions";
import { getTodayISODate } from "./KPIHelpers";
import { KPI_METRICS } from "./kpiMetrics";

interface KpiResponse {
  time_series?: Array<Record<string, unknown>>;
  summary?: { total_analyzed_posts?: number };
}

export default function KPIAnalytics() {
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(getTodayISODate());
  const [granularity, setGranularity] = useState("weekly");
  const [useSMA, setUseSMA] = useState(true);
  const [dynamicYAxis, setDynamicYAxis] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(
    KPI_METRICS.map(({ rawKey }) => rawKey),
  );
  const [downloadProgress, setDownloadProgress] = useState(0);
  const endpoint = `kpis/series?start_date=${startDate}&end_date=${endDate}&granularity=${granularity}&sma_window=7`;

  const { data, isLoading, isError, error } = useQuery<KpiResponse>({
    queryKey: ["kpi-analytics", startDate, endDate, granularity, useSMA],
    queryFn: ({ signal }) => {
      setDownloadProgress(0);
      return fetchingData({ endpoint, signal, progressCallBackFn: setDownloadProgress });
    },
    enabled: Boolean(startDate && endDate),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const toggleMetric = (key: string) => {
    setSelectedMetrics((selected) =>
      selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key],
    );
  };
  const summary = data?.summary ?? {};
  const timeSeriesData = data?.time_series ?? [];

  return (
    <VStack width="100%" align="stretch" bg="blackAlpha.900" borderWidth="1px" borderColor="whiteAlpha.200" p={6} borderRadius="md" gap={6}>
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
        <VStack align="start" gap={1}>
          <HStack gap={3}>
            <Text fontSize="xl" fontWeight="bold" color="orange.400">
              Social Media Empirical KPIs
            </Text>
            <Badge colorPalette="orange" variant="solid" px={2} py={0.5} fontSize="xs">
              All Subreddits
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            Temporal Resolution: {granularity.toUpperCase()} | Analyzed Corpus:{" "}
            {summary.total_analyzed_posts?.toLocaleString() ?? 0} posts
          </Text>
        </VStack>
        <DateSelector
          start={startDate}
          end={endDate}
          onChange={(newStart, newEnd) => {
            setStartDate(newStart);
            setEndDate(newEnd);
          }}
        />
      </Flex>

      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <HStack gap={2}>
          <Text fontSize="sm" color="gray.300" fontWeight="bold">
            Aggregation:
          </Text>
          {["daily", "weekly", "monthly"].map((value) => (
            <Button
              key={value}
              size="xs"
              variant={granularity === value ? "solid" : "outline"}
              colorPalette="orange"
              onClick={() => setGranularity(value)}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </HStack>
        <HStack gap={5}>
          <Toggle label="7D SMA" checked={useSMA} onChange={setUseSMA} />
          <Toggle label="Y-Axis Zoom" checked={dynamicYAxis} onChange={setDynamicYAxis} />
        </HStack>
      </Flex>

      <Flex wrap="wrap" gap={6} p={4} bg="whiteAlpha.50" borderRadius="md" borderColor="whiteAlpha.200" borderWidth="1px">
        {KPI_METRICS.map((metric) => {
          const checked = selectedMetrics.includes(metric.rawKey);
          return (
            <Checkbox.Root
              key={metric.rawKey}
              checked={checked}
              colorPalette="orange"
              onCheckedChange={() => toggleMetric(metric.rawKey)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control borderColor={metric.color} />
              <Checkbox.Label fontSize="sm" fontWeight="semibold" color={checked ? metric.color : "gray.400"}>
                {metric.label}
              </Checkbox.Label>
            </Checkbox.Root>
          );
        })}
      </Flex>

      <Box height="440px" width="100%" pt={2}>
        {isLoading ? (
          <Center height="100%">
            <VStack gap={2}>
              <Spinner color="orange.500" size="xl" />
              <Text fontSize="sm" color="gray.400">
                Downloading KPI chart... {downloadProgress}%
              </Text>
              <Progress.Root value={downloadProgress} width="min(100%, 360px)" colorPalette="orange">
                <Progress.Track><Progress.Range /></Progress.Track>
              </Progress.Root>
            </VStack>
          </Center>
        ) : isError ? (
          <Center height="100%">
            <Text color="red.400" fontSize="sm">
              Error loading analytics: {error?.message || "Internal Server Error"}
            </Text>
          </Center>
        ) : timeSeriesData.length === 0 ? (
          <Center height="100%">
            <Text color="gray.500" fontSize="sm">
              No analyzed posts found for the selected parameters.
            </Text>
          </Center>
        ) : (
          <KPIAnalyticsChart
            timeSeriesData={timeSeriesData}
            selectedMetrics={selectedMetrics}
            useSMA={useSMA}
            dynamicYAxis={dynamicYAxis}
          />
        )}
      </Box>

      <HypothesisTabs
        tabs={HYPOTHESIS_TABS}
        query={`start_date=${startDate}&end_date=${endDate}`}
        queryKey={["kpi-hypothesis", startDate, endDate]}
      />
    </VStack>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <HStack gap={2}>
      <Text fontSize="sm" color="gray.300">{label}</Text>
      <Switch.Root
        size="sm"
        colorPalette="orange"
        checked={checked}
        onCheckedChange={(event) => onChange(!!event.checked)}
      >
        <Switch.HiddenInput />
        <Switch.Control />
      </Switch.Root>
    </HStack>
  );
}