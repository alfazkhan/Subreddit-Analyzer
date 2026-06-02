import { useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import {
  Flex,
  HStack,
  Field,
  NumberInput,
  Box,
  Button,
} from "@chakra-ui/react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import keywordCount from "../../../../util/keywordCount";
import getTopKeywords from "../../../../util/getTopKeywords.js";

const legendMarginPlugin = {
  id: "legendMargin",
  beforeInit(chart) {
    // Get a reference to the original fit function
    const originalFit = chart.legend.fit;

    // Override the fit function
    chart.legend.fit = function fit() {
      // Call the original fit function
      originalFit.bind(chart.legend)();
      // Add extra height to the legend's fit dimensions
      this.height += 40; // This is your margin (in pixels)
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

function getRandomColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;
}

export default function KeywordsPieChart({ data }) {
  const [minValue, setMinValue] = useState(50);
  const [maxValue, setMaxValue] = useState(100); 

  const keywordsCount = keywordCount(data);


  const chartData = useMemo(() => {
    const filteredCount = Object.entries(keywordsCount).reduce(
      (acc, [k, v]) => {
        if (v >= minValue && v < maxValue) acc[k] = v;
        return acc;
      },
      {},
    );

    const labels = Object.keys(filteredCount);
    const colors = labels.map(() => getRandomColor());

    return {
      labels: labels,
      datasets: [
        {
          label: "Keyword Weights",
          data: Object.values(filteredCount),
          backgroundColor: colors,
          borderWidth: 1,
          offset: 10, // Adds a slight "exploded" gap between slices
        },
      ],
    };
  }, [keywordsCount, maxValue, minValue]);

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allows us to control height via the Box wrapper
    plugins: {
      legend: {
        labels: { color: "white", padding: 20 },
      },
      datalabels: {
        color: "white",
        font: { weight: "bold", size: 12 },
        formatter: (value, context) => {
          const label = context.chart.data.labels[context.dataIndex];
          return `${label}(${value})`;
        },
        anchor: "end",
        align: "end",
        offset: 10,
        display: (context) => {
          const dataset = context.dataset.data;
          const total = dataset.reduce((a, b) => a + b, 0);
          const value = dataset[context.dataIndex];
          return value / total > 0.03; // Hide if less than 3% of total
        },
      },
    },
    layout: {
      padding: {
        top: 30,
        bottom: 30,
        left: 30,
        right: 30,
      },
    },
  };

  return (
    <Flex direction="column" alignItems="center">
      <HStack mb={5} justifyContent="space-around" width="full">
        <Field.Root required alignItems="center">
          <Field.Label>
            Min Frequency <Field.RequiredIndicator />
          </Field.Label>
          <NumberInput.Root
            value={minValue}
            width="50%"
            allowMouseWheel
            onValueChange={(details) => setMinValue(details.valueAsNumber)}
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          {/* <Field.HelperText>
                  Enter Number of Posts to be scrapped
                </Field.HelperText> */}
        </Field.Root>
        <Field.Root required alignItems="center">
          <Field.Label>
            Max Frequency <Field.RequiredIndicator />
          </Field.Label>
          <NumberInput.Root
            value={maxValue}
            width="50%"
            allowMouseWheel
            onValueChange={(details) => setMaxValue(details.valueAsNumber)}
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          {/* <Field.HelperText>
                  Enter Number of Posts to be scrapped
                </Field.HelperText> */}
        </Field.Root>
      </HStack>
      <HStack>
        <Button
                        key="top10"
                        size="xs"
                        color="white"
                        fontWeight="black"
                        bg="orange.600"
                        onClick={()=>getTopKeywords(keywordsCount, 10, setMinValue, setMaxValue)}
                        marginBottom={2}
                        minW={"100px"}
                      >
                        Get Top 10
                      </Button>
                      <Button
                        key="top10"
                        size="xs"
                        color="white"
                        fontWeight="black"
                        bg="orange.600"
                        onClick={()=>getTopKeywords(keywordsCount, 50, setMinValue, setMaxValue)}
                        marginBottom={2}
                        minW={"100px"}
                      >
                        Get Top 50
                      </Button>
                      <Button
                        key="top10"
                        size="xs"
                        color="white"
                        fontWeight="black"
                        bg="orange.600"
                        onClick={()=>getTopKeywords(keywordsCount, 100, setMinValue, setMaxValue)}
                        marginBottom={2}
                        minW={"100px"}
                      >
                        Get Top 100
                      </Button>
      </HStack>
      <Box width="full" height="500px" mt="-20px">
        <Pie options={options} data={chartData} />
      </Box>
    </Flex>
  );
}
