import { useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { Chart, ChartOptions } from "chart.js";
import {
  Flex,
  HStack,
  Field,
  NumberInput,
  Box,
  Button,
  Input,
  Text,
} from "@chakra-ui/react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { stringToColor } from "@/util/data";
import { keywordsQueryOptions } from "@/util/api";
import { useQuery } from "@tanstack/react-query";
import { LoadingAndError } from "@/components/ui-components/Feedback";
import EChartsReact from 'react-echarts-library';
import type { EChartsOption } from "echarts";

const sumNumericData = (datasetData: readonly unknown[]) =>
  datasetData.reduce<number>(
    (acc, curr) => acc + (typeof curr === "number" ? curr : 0),
    0,
  );

// Adds padding between the legend and the chart
const legendMarginPlugin = {
  id: "legendMargin",
  beforeInit(chart: Chart<"doughnut">) {
    const legend = chart.legend;
    if (!legend) return;
    const originalFit = legend.fit;
    legend.fit = function fit() {
      originalFit.call(legend);
      legend.height += 40;
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

export default function KeywordsPieChart() {
  const { data, isLoading, isPending, isError, error } = useQuery(keywordsQueryOptions);

  const [minValue, setMinValue] = useState(20);
  const [maxValue, setMaxValue] = useState(20000);
  const [stopWordsStr, setStopWordsStr] = useState("");

  const [topLimit, setTopLimit] = useState(10);
  const [customTop, setCustomTop] = useState(15);

  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return { labels: [], datasets: [] };
    }

    const stopWords = stopWordsStr
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const filteredEntries = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const count = item.frequency ?? 0;
      const word = item.word;

      if (count < minValue || count > maxValue) continue;
      if (stopWords.includes(word.toLowerCase())) continue;

      filteredEntries.push({ name: word, value: count });
    }

    const topEntries = filteredEntries.slice(0, topLimit);

    const colors = topEntries.map((entry) => stringToColor(entry.name));



    return { topEntries: topEntries, colors: colors };
  }, [data, minValue, maxValue, stopWordsStr, topLimit]);


  const option = useMemo<EChartsOption>(() => ({
    color: chartData.colors,
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      bottom:'bottom'
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 1,

        },
        label: {
          show: true,
          position: 'outside',
          color:"#ffffff"
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 40,
            fontWeight: 'bold',
          }
        },
        labelLine: {
          show: true
        },
        data: chartData.topEntries
      }
    ],
    toolbox: {
      show: true,
      feature: {
        restore: { show: false },
      }
    }

  }), [chartData]);



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
        {[
          { label: "Min Frequency", value: minValue, onChange: setMinValue },
          { label: "Max Frequency", value: maxValue, onChange: setMaxValue },
        ].map((bound) => (
          <Field.Root key={bound.label} required width="auto">
            <Field.Label fontSize="xs" color="whiteAlpha.700">
              {bound.label}
            </Field.Label>
            <NumberInput.Root
              value={String(bound.value)}
              allowMouseWheel
              onValueChange={(details) => bound.onChange(details.valueAsNumber)}
              size="sm"
              color="white"
            >
              <NumberInput.Control />
              <NumberInput.Input />
            </NumberInput.Root>
          </Field.Root>
        ))}

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
              value={String(customTop)}
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

      <Box width="full" height="500px">
        <EChartsReact option={option} style={{ height: 400 }} />
      </Box>
    </Flex>
  );
}
