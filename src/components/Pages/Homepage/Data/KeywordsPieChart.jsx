import { useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  Flex,
  HStack,
  Field,
  NumberInput,
  Box,
  Button,
  Input,
  Text,
  Spinner,
  Center,
} from "@chakra-ui/react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { fetchingData } from "@/util/http";
import { useQuery } from "@tanstack/react-query";
import LoadingAndError from "@/components/ui-components/LoadingAndError";

// Adds padding between the legend and the chart
const legendMarginPlugin = {
  id: "legendMargin",
  beforeInit(chart) {
    const originalFit = chart.legend.fit;
    chart.legend.fit = function fit() {
      originalFit.bind(chart.legend)();
      this.height += 40;
    };
  },
};

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels,
  legendMarginPlugin,
);

// Deterministic color generator based on the keyword string
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

export default function KeywordsPieChart() {
  const { data, isLoading, isPending, isError, error } = useQuery({
    queryKey: ["keywords"],
    queryFn: ({ signal }) =>
      fetchingData({ endpoint: "posts/keywords", signal }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  // --- 1. Core Filter States ---
  const [minValue, setMinValue] = useState(20);
  const [maxValue, setMaxValue] = useState(20000);
  const [stopWordsStr, setStopWordsStr] = useState("");

  // --- 2. Interaction States ---
  const [topLimit, setTopLimit] = useState(10);
  const [customTop, setCustomTop] = useState(15);

  // --- 3. Streamlined Data Pipeline ---
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return { labels: [], datasets: [] };
    }

    const stopWords = stopWordsStr
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // 1. Direct filter using incoming schema: item.word and item.frequency
    const filteredEntries = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const count = item.frequency ?? 0;
      const word = item.word;

      if (count < minValue || count > maxValue) continue;
      if (stopWords.includes(word.toLowerCase())) continue;

      filteredEntries.push({ keyword: word, count: count });
    }

    // 2. Slice top entries (incoming list is already pre-sorted from database)
    const topEntries = filteredEntries.slice(0, topLimit);

    const labels = topEntries.map((e) => e.keyword);
    const dataValues = topEntries.map((e) => e.count);
    const colors = labels.map((label) => stringToColor(label));

    return {
      labels: labels,
      datasets: [
        {
          label: "Keyword Weights",
          data: dataValues,
          backgroundColor: colors,
          hoverOffset: 15,
        },
      ],
    };
  }, [data, minValue, maxValue, stopWordsStr, topLimit]);

  // --- 4. Chart Options ---
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        labels: { color: "white" },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (acc, curr) => acc + curr,
              0,
            );
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%";
            return ` ${context.label}: ${value.toLocaleString()} (${percentage})`;
          },
        },
      },
      datalabels: {
        color: "white",
        font: { weight: "bold", size: 12 },
        formatter: (value, context) => {
          return context.chart.data.labels[context.dataIndex];
        },
        display: (context) => {
          const dataset = context.dataset.data;
          const total = dataset.reduce((a, b) => a + b, 0);
          const value = dataset[context.dataIndex];
          return total > 0 && value / total > 0.03; // Hide labels on tiny slivers (<3%)
        },
      },
    },
    layout: {
      padding: { top: 30, bottom: 30, left: 30, right: 30 },
    },
  };

  if (isError || isPending || isLoading) {
    return (
      <LoadingAndError isLoading={isPending} isError={isError} error={error} />
    );
  }

  return (
    <Flex
      direction="column"
      alignItems="center"
      p={4}
      bg="blackAlpha.400"
      borderRadius="xl"
    >
      {/* Filters Row */}
      <HStack
        mb={4}
        justifyContent="space-between"
        width="full"
        wrap="wrap"
        gap={4}
      >
        <Field.Root required width="auto">
          <Field.Label fontSize="xs" color="whiteAlpha.700">
            Min Frequency
          </Field.Label>
          <NumberInput.Root
            value={minValue}
            allowMouseWheel
            onValueChange={(details) => setMinValue(details.valueAsNumber)}
            size="sm"
            color="white"
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
        </Field.Root>

        <Field.Root required width="auto">
          <Field.Label fontSize="xs" color="whiteAlpha.700">
            Max Frequency
          </Field.Label>
          <NumberInput.Root
            value={maxValue}
            allowMouseWheel
            onValueChange={(details) => setMaxValue(details.valueAsNumber)}
            size="sm"
            color="white"
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
        </Field.Root>

        <Field.Root flex="1" minW="200px">
          <Field.Label fontSize="xs" color="whiteAlpha.700">
            Exclude Words (comma separated)
          </Field.Label>
          <Input
            placeholder="e.g. http, www, post"
            value={stopWordsStr}
            onChange={(e) => setStopWordsStr(e.target.value)}
            size="sm"
            color="white"
          />
        </Field.Root>
      </HStack>

      {/* Limits & Controls Row */}
      <HStack
        width="full"
        justifyContent="flex-start"
        wrap="wrap"
        gap={4}
        mb={6}
      >
        <HStack gap={2}>
          {[10, 50, 100, 500].map((limitOption) => (
            <Button
              key={limitOption}
              size="xs"
              colorPalette={topLimit === limitOption ? "orange" : "gray"}
              variant={topLimit === limitOption ? "solid" : "surface"}
              onClick={() => setTopLimit(limitOption)}
            >
              Top {limitOption}
            </Button>
          ))}
        </HStack>

        <Field.Root
          width="auto"
          display="flex"
          flexDirection="row"
          alignItems="center"
          gap={2}
        >
          <Text fontSize="xs" color="whiteAlpha.700" whiteSpace="nowrap">
            Custom Limit:
          </Text>
          <HStack gap={1}>
            <NumberInput.Root
              value={customTop}
              allowMouseWheel
              onValueChange={(details) => setCustomTop(details.valueAsNumber)}
              size="xs"
              min={1}
              max={30}
              maxW="70px"
              color="white"
            >
              <NumberInput.Control />
              <NumberInput.Input />
            </NumberInput.Root>
            <Button
              size="xs"
              colorPalette="orange"
              variant={topLimit === customTop ? "solid" : "surface"}
              onClick={() => setTopLimit(customTop)}
            >
              Apply
            </Button>
          </HStack>
        </Field.Root>
      </HStack>

      {/* Chart Rendering */}
      <Box width="full" height="500px">
        <Doughnut options={options} data={chartData} />
      </Box>
    </Flex>
  );
}
