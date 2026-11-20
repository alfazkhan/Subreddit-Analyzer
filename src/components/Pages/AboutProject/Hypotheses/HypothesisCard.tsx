import { useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import EChartsReact from "react-echarts-library";
import type { EChartsOption } from "echarts";
import type { HypothesisCardData } from "@/util/Types";
import { C, VerdictPill } from "../aboutUi";
import { LuChevronRight, LuInfo } from "react-icons/lu";

interface HypothesisCardProps {
  hypothesis: HypothesisCardData;
}

const AXIS_LABEL = { color: "#a1a1aa", fontSize: 11 };
const CATEGORY_LABEL = { color: "#e4e4e7", fontSize: 12 };
const SPLIT_LINE = { lineStyle: { color: "rgba(255,255,255,0.07)" } };
const TOOLTIP = {
  backgroundColor: "#18181b",
  borderColor: "#3f3f46",
  textStyle: { color: "#e4e4e7", fontSize: 12 },
};
const ORANGE = "#fb923c";
const TEAL = "#2dd4bf";

const H7_B1 = 1080.13;
const H7_B2 = -707.26;
const H7_PEAK = -H7_B1 / (2 * H7_B2);

const CHART_CAPTIONS: Partial<Record<NonNullable<HypothesisCardData["chartType"]>, string>> = {
  h1_bars: "Spearman correlation with negativity. Right of zero means more; left means less.",
  h5_bars: "Average negativity and upvote ratio for each topic group. Axis starts at 0.",
  h6_bars: "Average negativity by local time of day. The axis starts at 0.30 so the small differences are visible.",
  h7_curve:
    "Fitted curve from the regression (intercept and city-size control left out), not raw data. The dashed line marks the peak.",
};

function buildChartOption(chartType: HypothesisCardData["chartType"]): EChartsOption | null {
  switch (chartType) {
    case "h1_bars":
      return {
        backgroundColor: "transparent",
        tooltip: { ...TOOLTIP, trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { top: 10, right: 56, bottom: 24, left: 8, containLabel: true },
        xAxis: { type: "value", min: -0.1, max: 0.3, interval: 0.1, splitLine: SPLIT_LINE, axisLabel: AXIS_LABEL },
        yAxis: {
          type: "category",
          inverse: true,
          data: ["Comments, all cities", "Upvote ratio, all cities", "Upvote ratio, Berlin"],
          axisLabel: CATEGORY_LABEL,
          axisTick: { show: false },
          axisLine: { show: false },
        },
        series: [
          {
            name: "Spearman ρ",
            type: "bar",
            barWidth: 18,
            data: [
              { value: 0.1924, itemStyle: { color: TEAL } },
              { value: -0.0254, itemStyle: { color: ORANGE } },
              { value: -0.0859, itemStyle: { color: ORANGE } },
            ],
            label: { show: true, position: "right", color: "#e4e4e7", fontSize: 11 },
          },
        ],
      };

    case "h5_bars":
      return {
        backgroundColor: "transparent",
        tooltip: { ...TOOLTIP, trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { top: 0, left: 0, textStyle: { color: "#d4d4d8", fontSize: 12 }, itemWidth: 12, itemHeight: 12 },
        grid: { top: 40, right: 8, bottom: 24, left: 8, containLabel: true },
        xAxis: {
          type: "category",
          data: ["Negativity", "Upvote ratio"],
          axisLabel: CATEGORY_LABEL,
          axisTick: { show: false },
        },
        yAxis: { type: "value", min: 0, max: 1, splitLine: SPLIT_LINE, axisLabel: AXIS_LABEL },
        series: [
          {
            name: "Admin & housing",
            type: "bar",
            barGap: "10%",
            data: [0.3842, 0.7356],
            itemStyle: { color: ORANGE },
            label: { show: true, position: "top", color: "#e4e4e7", fontSize: 11 },
          },
          {
            name: "Lifestyle & culture",
            type: "bar",
            data: [0.3315, 0.769],
            itemStyle: { color: TEAL },
            label: { show: true, position: "top", color: "#e4e4e7", fontSize: 11 },
          },
        ],
      };

    case "h6_bars":
      return {
        backgroundColor: "transparent",
        tooltip: { ...TOOLTIP, trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { top: 24, right: 8, bottom: 24, left: 8, containLabel: true },
        xAxis: {
          type: "category",
          data: ["Night\n00–06", "Morning\n06–13", "Afternoon\n13–19", "Evening\n19–24"],
          axisLabel: { ...CATEGORY_LABEL, lineHeight: 16 },
          axisTick: { show: false },
        },
        yAxis: { type: "value", min: 0.3, max: 0.38, splitLine: SPLIT_LINE, axisLabel: AXIS_LABEL },
        series: [
          {
            name: "Average negativity",
            type: "bar",
            barWidth: "45%",
            data: [
              { value: 0.3399, itemStyle: { color: "#71717a" } },
              { value: 0.3679, itemStyle: { color: ORANGE } },
              { value: 0.3611, itemStyle: { color: "#71717a" } },
              { value: 0.3601, itemStyle: { color: "#71717a" } },
            ],
            label: { show: true, position: "top", color: "#e4e4e7", fontSize: 11 },
          },
        ],
      };

    case "h7_curve": {
      const points: [number, number][] = [];
      for (let i = 10; i <= 100; i += 2) {
        const ttr = i / 100;
        points.push([ttr, Number((H7_B1 * ttr + H7_B2 * ttr * ttr).toFixed(1))]);
      }
      return {
        backgroundColor: "transparent",
        tooltip: {
          ...TOOLTIP,
          trigger: "axis",
          valueFormatter: (v) => (typeof v === "number" ? v.toFixed(1) : String(v)),
        },
        grid: { top: 24, right: 16, bottom: 36, left: 8, containLabel: true },
        xAxis: {
          type: "value",
          min: 0.1,
          max: 1,
          name: "Type-token ratio",
          nameLocation: "middle",
          nameGap: 28,
          nameTextStyle: AXIS_LABEL,
          axisLabel: AXIS_LABEL,
          splitLine: SPLIT_LINE,
        },
        yAxis: {
          type: "value",
          name: "Comments (fitted)",
          nameTextStyle: { ...AXIS_LABEL, align: "left" },
          axisLabel: AXIS_LABEL,
          splitLine: SPLIT_LINE,
        },
        series: [
          {
            name: "Fitted comments",
            type: "line",
            smooth: true,
            showSymbol: false,
            data: points,
            lineStyle: { color: ORANGE, width: 2.5 },
            markLine: {
              silent: true,
              symbol: "none",
              lineStyle: { color: "#a1a1aa", type: "dashed" },
              label: { formatter: `peak ≈ ${H7_PEAK.toFixed(3)}`, color: "#e4e4e7", fontSize: 11 },
              data: [{ xAxis: Number(H7_PEAK.toFixed(3)) }],
            },
          },
        ],
      };
    }

    default:
      return null;
  }
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="sm" fontWeight="semibold" color={C.heading} mb={1}>
      {children}
    </Text>
  );
}

export function HypothesisCard({ hypothesis }: HypothesisCardProps) {
  const chartOption = useMemo(() => buildChartOption(hypothesis.chartType), [hypothesis.chartType]);
  const caption = hypothesis.chartType ? CHART_CAPTIONS[hypothesis.chartType] : undefined;

  return (
    <Box
      as="article"
      id={`hypothesis-${hypothesis.id}`}
      scrollMarginTop="96px"
      aria-labelledby={`hypothesis-${hypothesis.id}-title`}
      bg="whiteAlpha.50"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      borderRadius="xl"
      p={{ base: 5, md: 7 }}
    >
      {/* Header */}
      <Box display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={3} mb={3}>
        <Box display="flex" alignItems="baseline" gap={3}>
          <Text fontFamily="mono" fontSize="sm" color={C.accent}>
            {hypothesis.id}
          </Text>
          <Text as="h4" id={`hypothesis-${hypothesis.id}-title`} fontSize="lg" fontWeight="semibold" color={C.heading}>
            {hypothesis.name}
          </Text>
        </Box>
        <VerdictPill verdict={hypothesis.verdict} />
      </Box>

      <Text fontSize={{ base: "md", md: "lg" }} color="gray.200" lineHeight="1.55" mb={6}>
        {hypothesis.plainQuestion}
      </Text>

      <Box display="grid" gap={5}>
        <Box>
          <Label>What we found</Label>
          <Text color={C.text} lineHeight="1.7">
            {hypothesis.whatItTellsUs}
          </Text>
        </Box>

        {chartOption && (
          <Box as="figure" m={0}>
            <EChartsReact option={chartOption} style={{ height: hypothesis.chartType === "h1_bars" ? "170px" : "240px", width: "100%" }} />
            {caption && (
              <Text as="figcaption" fontSize="xs" color={C.muted} mt={1} lineHeight="1.5">
                {caption}
              </Text>
            )}
          </Box>
        )}

        <Box>
          <Label>Keep in mind</Label>
          <Text color={C.text} lineHeight="1.7">
            {hypothesis.whatItDoesNotTellUs}
          </Text>
        </Box>

        {hypothesis.calloutNote && (
          <Box display="flex" gap={2.5} fontSize="sm" color="gray.400" lineHeight="1.6">
            <Box as="span" flexShrink={0} mt="3px" color={C.muted}>
              <LuInfo size={15} />
            </Box>
            <Text>{hypothesis.calloutNote}</Text>
          </Box>
        )}

        {/* Method & stats, collapsed by default */}
        <Box
          as="details"
          borderTopWidth="1px"
          borderColor="whiteAlpha.100"
          pt={4}
          css={{
            "& > summary::-webkit-details-marker": { display: "none" },
            "&[open] > summary svg": { transform: "rotate(90deg)" },
          }}
        >
          <Box
            as="summary"
            cursor="pointer"
            listStyleType="none"
            display="inline-flex"
            alignItems="center"
            gap={1.5}
            fontSize="sm"
            fontWeight="medium"
            color="gray.400"
            _hover={{ color: "gray.200" }}
            _focusVisible={{ outline: "2px solid", outlineColor: "orange.400", outlineOffset: "2px" }}
          >
            <LuChevronRight size={16} style={{ transition: "transform 150ms ease" }} />
            Method and statistics
          </Box>

          <Box display="grid" gap={5} mt={4}>
            <Box>
              <Label>Result</Label>
              <Text fontFamily="mono" fontSize="xs" color="gray.200" lineHeight="1.8" bg="blackAlpha.400" p={3} borderRadius="md">
                {hypothesis.snapshotResult}
              </Text>
              <Text fontSize="sm" color={C.text} mt={2}>
                {hypothesis.verdictDetail}
              </Text>
            </Box>

            <Box>
              <Label>Method</Label>
              <Text fontSize="sm" color={C.text} lineHeight="1.7">
                {hypothesis.methodAndRationale}
              </Text>
            </Box>

            <Box>
              <Label>Variables</Label>
              <Box as="table" width="full" fontSize="sm" style={{ borderCollapse: "collapse" }}>
                <tbody>
                  {hypothesis.variables.map((v) => (
                    <Box as="tr" key={v.name} borderTopWidth="1px" borderColor="whiteAlpha.100" verticalAlign="top">
                      <Box as="td" py={2} pr={3} fontFamily="mono" fontSize="xs" color="orange.200" whiteSpace="nowrap">
                        {v.name}
                      </Box>
                      <Box as="td" py={2} pr={3} color={C.muted} whiteSpace="nowrap">
                        {v.role}
                      </Box>
                      <Box as="td" py={2} color={C.text}>
                        {v.description}
                      </Box>
                    </Box>
                  ))}
                </tbody>
              </Box>
            </Box>

            <Box>
              <Label>Formal statement</Label>
              <Text fontSize="sm" color="gray.400" fontStyle="italic" lineHeight="1.7">
                {hypothesis.formalStatement}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
