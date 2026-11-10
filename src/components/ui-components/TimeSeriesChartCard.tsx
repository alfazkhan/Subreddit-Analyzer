import { Badge, Box, Button, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import type { EChartsOption } from "echarts";
import EChartsReact from "react-echarts-library";
import { DateSelector } from "./FormControls";
import { QueryStateView } from "./Feedback";

export interface TimeSeriesChartCardProps {
  title: string;
  badgeText?: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  onAllTime: () => void;
  isLoading: boolean;
  isError: boolean;
  error?: { message?: string } | null;
  errorPrefix: string;
  option: EChartsOption;
  chartHeight?: string;
}

/**
 * Shared analytics card with date-range controls, loading/error handling,
 * and an ECharts canvas renderer.
 */
export default function TimeSeriesChartCard({
  title,
  badgeText = "Local Timezone Synchronized",
  subtitle,
  startDate,
  endDate,
  onDateChange,
  onAllTime,
  isLoading,
  isError,
  error,
  errorPrefix,
  option,
  chartHeight = "360px",
}: TimeSeriesChartCardProps) {
  return (
    <Box
      p={6}
      bg="blackAlpha.400"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      position="relative"
    >
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        mb={6}
        wrap="wrap"
        gap={4}
      >
        <Box>
          <HStack gap={3}>
            <Heading size="md" color="orange.400">
              {title}
            </Heading>
            {badgeText && (
              <Badge colorPalette="orange" variant="solid" fontSize="2xs">
                {badgeText}
              </Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.400" mt={1}>
            {subtitle}
          </Text>
        </Box>

        <HStack gap={4} wrap="wrap" alignItems="flex-start">
          <Button
            type="button"
            size="sm"
            mt={5}
            variant={!startDate && !endDate ? "solid" : "outline"}
            colorPalette="orange"
            onClick={onAllTime}
          >
            All Time
          </Button>

          <DateSelector
            start={startDate}
            end={endDate}
            onChange={onDateChange}
          />
        </HStack>
      </Flex>

      <Box height={chartHeight} width="full">
        <QueryStateView
          isLoading={isLoading}
          isError={isError}
          error={error}
          errorPrefix={errorPrefix}
        >
          <EChartsReact
            option={option}
            opts={{ renderer: "canvas", devicePixelRatio: 2 }}
            style={{ width: "100%", height: "100%" }}
          />
        </QueryStateView>
      </Box>

      {startDate && endDate && (
        <Badge variant="surface" mt={4} colorPalette="orange">
          Range: {startDate} to {endDate}
        </Badge>
      )}
    </Box>
  );
}
