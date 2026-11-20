import { useMemo } from "react";
import {
  Badge,
  Box,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import EChartsReact from "react-echarts-library";
import type { EChartsOption } from "echarts";
import type { HypothesisCardData } from "@/util/Types";
import { LuCheck, LuCircleHelp, LuInfo } from "react-icons/lu";

interface HypothesisCardProps {
  hypothesis: HypothesisCardData;
}

export function HypothesisCard({ hypothesis }: HypothesisCardProps) {
  // Verdict badge formatting with shape + text
  const renderVerdictBadge = () => {
    switch (hypothesis.verdict) {
      case "Supported":
        return (
          <Badge
            colorPalette="green"
            variant="solid"
            size="md"
            px={2.5}
            py={1}
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            <LuCheck size={14} />
            <Text fontWeight="bold">Supported</Text>
          </Badge>
        );
      case "Supported, small effect":
        return (
          <Badge
            colorPalette="yellow"
            variant="solid"
            size="md"
            px={2.5}
            py={1}
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            <LuCheck size={14} />
            <Text fontWeight="bold">Supported, small effect</Text>
          </Badge>
        );
      case "Inconclusive":
      default:
        return (
          <Badge
            colorPalette="gray"
            variant="solid"
            size="md"
            px={2.5}
            py={1}
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            <LuCircleHelp size={14} />
            <Text fontWeight="bold">Inconclusive</Text>
          </Badge>
        );
    }
  };

  // ECharts options for H1, H5, H6, H7
  const chartOption = useMemo<EChartsOption | null>(() => {
    if (hypothesis.chartType === "h1_bars") {
      return {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        grid: { top: 30, right: 20, bottom: 30, left: 160 },
        xAxis: {
          type: "value",
          min: -0.15,
          max: 0.25,
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
          axisLabel: { color: "#9ca3af", fontSize: 10 },
        },
        yAxis: {
          type: "category",
          data: ["Global P_neg vs Comments", "Global P_neg vs Upvote Ratio", "Berlin P_neg vs Upvote Ratio"],
          axisLabel: { color: "#e5e7eb", fontSize: 11 },
          axisTick: { show: false },
        },
        series: [
          {
            name: "Spearman ρ",
            type: "bar",
            data: [
              { value: 0.1924, itemStyle: { color: "#38bdf8" } },
              { value: -0.0254, itemStyle: { color: "#f87171" } },
              { value: -0.0859, itemStyle: { color: "#ef4444" } },
            ],
            label: {
              show: true,
              position: "right",
              formatter: "{c}",
              color: "#e5e7eb",
              fontSize: 10,
            },
          },
        ],
      };
    }

    if (hypothesis.chartType === "h5_bars") {
      return {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        legend: {
          data: ["Admin & Housing", "Lifestyle & Culture"],
          textStyle: { color: "#e5e7eb", fontSize: 11 },
          top: 0,
        },
        grid: { top: 35, right: 20, bottom: 25, left: 60 },
        xAxis: {
          type: "category",
          data: ["Negative Sentiment (P_neg)", "Upvote Ratio (Approval)"],
          axisLabel: { color: "#e5e7eb", fontSize: 11 },
        },
        yAxis: {
          type: "value",
          min: 0,
          max: 1.0,
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
          axisLabel: { color: "#9ca3af", fontSize: 10 },
        },
        series: [
          {
            name: "Admin & Housing",
            type: "bar",
            data: [0.3842, 0.7356],
            itemStyle: { color: "#f97316" },
            label: { show: true, position: "top", color: "#e5e7eb", fontSize: 10 },
          },
          {
            name: "Lifestyle & Culture",
            type: "bar",
            data: [0.3315, 0.769],
            itemStyle: { color: "#4ade80" },
            label: { show: true, position: "top", color: "#e5e7eb", fontSize: 10 },
          },
        ],
      };
    }

    if (hypothesis.chartType === "h6_bars") {
      return {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        grid: { top: 25, right: 20, bottom: 25, left: 50 },
        xAxis: {
          type: "category",
          data: ["Night (00–05)", "Morning (06–12)", "Afternoon (13–18)", "Evening (19–23)"],
          axisLabel: { color: "#e5e7eb", fontSize: 11 },
        },
        yAxis: {
          type: "value",
          min: 0.3,
          max: 0.4,
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
          axisLabel: { color: "#9ca3af", fontSize: 10 },
        },
        series: [
          {
            name: "Mean Negative Sentiment",
            type: "bar",
            data: [0.3399, 0.3679, 0.3611, 0.3601],
            itemStyle: { color: "#c084fc" },
            label: { show: true, position: "top", color: "#e5e7eb", fontSize: 10 },
          },
        ],
      };
    }

    if (hypothesis.chartType === "h7_curve") {
      const dataPoints: [number, number][] = [];
      for (let ttr = 0.1; ttr <= 1.0; ttr += 0.02) {
        const y = 1080.13 * ttr - 707.26 * Math.pow(ttr, 2);
        dataPoints.push([Number(ttr.toFixed(2)), Number(y.toFixed(1))]);
      }

      return {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "axis",
          formatter: "TTR: {c0}<br/>Normalized Comments: {c1}",
        },
        grid: { top: 30, right: 25, bottom: 35, left: 60 },
        xAxis: {
          type: "value",
          min: 0.1,
          max: 1.0,
          name: "Type-Token Ratio (TTR)",
          nameLocation: "middle",
          nameGap: 24,
          nameTextStyle: { color: "#9ca3af", fontSize: 10 },
          axisLabel: { color: "#9ca3af", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        },
        yAxis: {
          type: "value",
          name: "Norm. Comments",
          nameTextStyle: { color: "#9ca3af", fontSize: 10 },
          axisLabel: { color: "#9ca3af", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        },
        series: [
          {
            name: "Fitted Curve (y = 1080.13x − 707.26x²)",
            type: "line",
            smooth: true,
            data: dataPoints,
            lineStyle: { color: "#f97316", width: 2.5 },
            markPoint: {
              data: [
                {
                  name: "Peak (TTR* ≈ 0.764)",
                  coord: [0.764, 412.6],
                  value: "Peak ≈ 0.764",
                  itemStyle: { color: "#ef4444" },
                },
              ],
            },
          },
        ],
      };
    }

    return null;
  }, [hypothesis.chartType]);

  return (
    <Box
      bg="gray.950"
      borderWidth="1px"
      borderColor="gray.800"
      borderRadius="xl"
      p={{ base: 5, md: 6 }}
      boxShadow="sm"
    >
      <VStack align="stretch" gap={5}>
        {/* Header row: ID, Name, Verdict badge */}
        <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} wrap="wrap" gap={3}>
          <HStack gap={3}>
            <Badge colorPalette="orange" variant="solid" px={2.5} py={1} fontSize="xs" fontWeight="bold">
              {hypothesis.id}
            </Badge>
            <Text fontSize="lg" fontWeight="bold" color="gray.100">
              {hypothesis.name}
            </Text>
          </HStack>
          {renderVerdictBadge()}
        </Flex>

        {/* 1. Question in plain words */}
        <Box>
          <Text fontSize="2xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
            Question in Plain Words
          </Text>
          <Text fontSize="sm" color="gray.200" fontWeight="medium">
            {hypothesis.plainQuestion}
          </Text>
        </Box>

        {/* 2. Formal statement */}
        <Box bg="blackAlpha.700" p={3.5} borderRadius="md" borderLeftWidth="3px" borderColor="orange.500">
          <Text fontSize="2xs" fontWeight="bold" color="orange.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
            Formal Academic Statement
          </Text>
          <Text fontSize="xs" color="gray.300" fontStyle="italic" lineHeight="1.7">
            &ldquo;{hypothesis.formalStatement}&rdquo;
          </Text>
        </Box>

        {/* 3. Variables */}
        <Box>
          <Text fontSize="2xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>
            Operationalized Variables
          </Text>
          <Flex wrap="wrap" gap={2}>
            {hypothesis.variables.map((v) => (
              <Box key={v.name} bg="whiteAlpha.50" px={3} py={1.5} borderRadius="md" borderWidth="1px" borderColor="gray.800" flex="1 1 calc(50% - 6px)" minW="220px">
                <HStack justify="space-between" mb={0.5}>
                  <Text fontSize="xs" fontWeight="bold" color="orange.300" fontFamily="mono">
                    {v.name}
                  </Text>
                  <Badge
                    size="xs"
                    variant="outline"
                    colorPalette={
                      v.role === "Dependent"
                        ? "green"
                        : v.role === "Independent"
                        ? "blue"
                        : v.role === "Moderator"
                        ? "purple"
                        : "gray"
                    }
                  >
                    {v.role}
                  </Badge>
                </HStack>
                <Text fontSize="2xs" color="gray.400">
                  {v.description}
                </Text>
              </Box>
            ))}
          </Flex>
        </Box>

        {/* 4. Method and why this method */}
        <Box>
          <Text fontSize="2xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
            Method &amp; Methodological Rationale
          </Text>
          <Text fontSize="xs" color="gray.300" lineHeight="1.6">
            {hypothesis.methodAndRationale}
          </Text>
        </Box>

        {/* 5. Snapshot result */}
        <Box bg="whiteAlpha.50" p={3} borderRadius="md">
          <Text fontSize="2xs" fontWeight="bold" color="orange.300" textTransform="uppercase" letterSpacing="wider" mb={1}>
            Thesis Snapshot Result (November 2026, N = 51,587)
          </Text>
          <Text fontSize="xs" color="gray.200" lineHeight="1.6" fontFamily="mono">
            {hypothesis.snapshotResult}
          </Text>
        </Box>

        {/* 6. Verdict detail */}
        <Box>
          <Text fontSize="2xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
            Empirical Verdict
          </Text>
          <Text fontSize="xs" color="gray.300" lineHeight="1.6">
            {hypothesis.verdictDetail}
          </Text>
        </Box>

        {/* Callout Note (e.g. for H4 or code discrepancy) */}
        {hypothesis.calloutNote && (
          <Box bg="blackAlpha.800" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.800">
            <HStack align="flex-start" gap={2}>
              <LuInfo size={16} color="#f97316" style={{ marginTop: "2px", flexShrink: 0 }} />
              <Text fontSize="xs" color="gray.400" lineHeight="1.5">
                {hypothesis.calloutNote}
              </Text>
            </HStack>
          </Box>
        )}

        {/* ECharts Visualization (when applicable) */}
        {chartOption && (
          <Box mt={1} pt={2} borderTopWidth="1px" borderColor="gray.850">
            <HStack justify="space-between" mb={1}>
              <Text fontSize="2xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                Statistical Distribution Chart
              </Text>
              {hypothesis.id === "H7" && (
                <Badge variant="subtle" colorPalette="orange" size="2xs">
                  fitted curve, not raw data
                </Badge>
              )}
              {hypothesis.id === "H5" && (
                <Text fontSize="2xs" color="gray.500">
                  Axis scale starts at zero (0.0 to 1.0)
                </Text>
              )}
            </HStack>
            <EChartsReact option={chartOption} style={{ height: "220px", width: "100%" }} />
          </Box>
        )}

        {/* 7. What this does and does not tell us */}
        <Flex direction={{ base: "column", md: "row" }} gap={3} pt={2} borderTopWidth="1px" borderColor="gray.850">
          <Box flex="1" bg="whiteAlpha.50" p={3} borderRadius="md">
            <Text fontSize="2xs" fontWeight="bold" color="green.400" textTransform="uppercase" mb={1}>
              What This Tells Us
            </Text>
            <Text fontSize="xs" color="gray.400" lineHeight="1.6">
              {hypothesis.whatItTellsUs}
            </Text>
          </Box>
          <Box flex="1" bg="whiteAlpha.50" p={3} borderRadius="md">
            <Text fontSize="2xs" fontWeight="bold" color="yellow.400" textTransform="uppercase" mb={1}>
              What This Does Not Tell Us
            </Text>
            <Text fontSize="xs" color="gray.400" lineHeight="1.6">
              {hypothesis.whatItDoesNotTellUs}
            </Text>
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
}
