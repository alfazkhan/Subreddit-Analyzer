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
  Text
} from "@chakra-ui/react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import keywordCount from "../../../../util/keywordCount";

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

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels, legendMarginPlugin);

// ✓ FIXED: Deterministic color generator based on the keyword string.
// This prevents the chart from violently flashing random colors on every re-render.
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Convert hash to an HSL color for bright, distinct slices
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

export default function KeywordsPieChart({ data }) {
  // --- 1. Core Filter States ---
  const [minValue, setMinValue] = useState(20);
  const [maxValue, setMaxValue] = useState(10000);
  const [stopWordsStr, setStopWordsStr] = useState("");
  
  // --- 2. Interaction States ---
  const [topLimit, setTopLimit] = useState(10); // Strict limit for pie chart slices
  const [customTop, setCustomTop] = useState(15); 

  const keywordsCount = keywordCount(data);

  // --- 3. Master Data Pipeline ---
  const chartData = useMemo(() => {
    const stopWords = stopWordsStr
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const entries = [];
    
    // 1. Filter out boundaries and stop-words
    for (const [keyword, count] of Object.entries(keywordsCount)) {
      if (count < minValue || count > maxValue) continue;
      if (stopWords.includes(keyword.toLowerCase())) continue;
      entries.push({ keyword, count });
    }

    // 2. Sort descending
    entries.sort((a, b) => b.count - a.count);

    // 3. Slice for Top X
    const topEntries = entries.slice(0, topLimit);
    
    // 4. ✓ FIXED: Aggregate everything else into an "Other" category
    const otherEntries = entries.slice(topLimit);
    const otherSum = otherEntries.reduce((sum, item) => sum + item.count, 0);

    const labels = topEntries.map((e) => e.keyword);
    const dataValues = topEntries.map((e) => e.count);
    const colors = labels.map((label) => stringToColor(label));

    // Append the "Other" slice if there is leftover data
    if (otherSum > 0) {
      labels.push("Other");
      dataValues.push(otherSum);
      colors.push("#4A5568"); // Consistent dark gray for the "Other" slice
    }

    return {
      labels: labels,
      datasets: [
        {
          label: "Keyword Weights",
          data: dataValues,
          backgroundColor: colors,
          borderColor: "#1A202C", // Dark border to match your dark theme
          borderWidth: 2,
          hoverOffset: 15, // Smooth pop-out effect on hover
        },
      ],
    };
  }, [keywordsCount, minValue, maxValue, stopWordsStr, topLimit]);

  // --- 4. Chart Options ---
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%", // Makes it a modern Doughnut chart
    plugins: {
      legend: {
        labels: { color: "white", padding: 20 },
      },
      // ✓ FIXED: Upgraded tooltips to automatically calculate and display percentages
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
            const percentage = ((value / total) * 100).toFixed(1) + "%";
            return ` ${context.label}: ${value} (${percentage})`;
          },
        },
      },
      datalabels: {
        color: "white",
        font: { weight: "bold", size: 12 },
        textStrokeColor: "rgba(0,0,0,0.8)", // Adds outline so text is readable on any slice color
        textStrokeWidth: 3,
        formatter: (value, context) => {
          const label = context.chart.data.labels[context.dataIndex];
          return `${label}`;
        },
        display: (context) => {
          const dataset = context.dataset.data;
          const total = dataset.reduce((a, b) => a + b, 0);
          const value = dataset[context.dataIndex];
          return value / total > 0.03; // Hide labels on tiny slivers (<3%)
        },
      },
    },
    layout: {
      padding: { top: 30, bottom: 30, left: 30, right: 30 },
    },
  };

  return (
    <Flex direction="column" alignItems="center" p={4} bg="blackAlpha.400" borderRadius="xl" borderWidth="1px" borderColor="whiteAlpha.200">
      
      {/* Filters Row */}
      <HStack mb={4} justifyContent="space-between" width="full" wrap="wrap" gap={4}>
        <Field.Root required width="auto">
          <Field.Label fontSize="xs" color="whiteAlpha.700">Min Frequency</Field.Label>
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
          <Field.Label fontSize="xs" color="whiteAlpha.700">Max Frequency</Field.Label>
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
          <Field.Label fontSize="xs" color="whiteAlpha.700">Exclude Words (comma separated)</Field.Label>
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
      <HStack width="full" justifyContent="flex-start" wrap="wrap" gap={4} mb={6}>
        <HStack gap={2}>
          <Button size="xs" colorPalette={topLimit === 10 ? "green" : "orange"} variant={topLimit === 10 ? "solid" : "outline"} onClick={() => setTopLimit(10)}>
            Top 10
          </Button>
          <Button size="xs" colorPalette={topLimit === 50 ? "green" : "orange"} variant={topLimit === 50 ? "solid" : "outline"} onClick={() => setTopLimit(50)}>
            Top 50
          </Button>
          <Button size="xs" colorPalette={topLimit === 100 ? "green" : "orange"} variant={topLimit === 100 ? "solid" : "outline"} onClick={() => setTopLimit(100)}>
            Top 100
          </Button>
          <Button size="xs" colorPalette={topLimit === 500 ? "green" : "orange"} variant={topLimit === 500 ? "solid" : "outline"} onClick={() => setTopLimit(500)}>
            Top 500
          </Button>
        </HStack>

        <Field.Root width="auto" display="flex" flexDirection="row" alignItems="center" gap={2}>
          <Text fontSize="xs" color="whiteAlpha.700" whiteSpace="nowrap">Custom Limit:</Text>
          <HStack gap={1}>
            <NumberInput.Root
              value={customTop}
              allowMouseWheel
              onValueChange={(details) => setCustomTop(details.valueAsNumber)}
              size="xs"
              min={1}
              max={30} // Hard cap so users don't freeze the browser rendering 100 slices
              maxW="70px"
              color="white"
            >
              <NumberInput.Control />
              <NumberInput.Input />
            </NumberInput.Root>
            <Button size="xs" colorPalette={topLimit === customTop ? "green" : "orange"} variant={topLimit === customTop ? "solid" : "outline"} onClick={() => setTopLimit(customTop)}>
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