import { useState } from "react";
import { Badge, Box, Tabs, VStack } from "@chakra-ui/react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { fetchingData } from "@/util/api";
import { ORANGE_TABS_CSS } from "@/util/constants";
import { QueryStateView } from "@/components/ui-components/Feedback";
import type { HypothesisTabDefinition } from "./KPIHelpers";

interface HypothesisTabsProps<TResponse> {
  tabs: HypothesisTabDefinition<TResponse>[];
  query: string;
  queryKey: readonly unknown[];
  enabled?: boolean;
  canFetch?: boolean;
}

export default function HypothesisTabs<TResponse>({
  tabs,
  query,
  queryKey,
  enabled = true,
  canFetch = true,
}: HypothesisTabsProps<TResponse>) {
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.value ?? "");
  const activeTab = tabs.find((tab) => tab.value === selectedTab) ?? tabs[0];
  const activeTabValue = activeTab?.value ?? "";
  const queryClient = useQueryClient();
  const shouldFetch = enabled && canFetch;

  let allPreviousSettled = true;
  const results = useQueries({
    queries: tabs.map((tab) => {
      const tabQueryKey = [...queryKey, tab.value] as const;
      const isEnabledForTab = shouldFetch && allPreviousSettled;
      const state = queryClient.getQueryState(tabQueryKey);
      const isCurrentSettled =
        state !== undefined &&
        state.status !== "pending" &&
        state.fetchStatus === "idle";
      allPreviousSettled = allPreviousSettled && isCurrentSettled;

      return {
        queryKey: tabQueryKey,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          fetchingData({
            endpoint: `kpis/${tab.value}?${query}`,
            signal,
          }) as Promise<TResponse>,
        enabled: isEnabledForTab,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      };
    }),
  });

  if (!activeTab) return null;

  return (
    <Tabs.Root
      value={activeTabValue}
      onValueChange={(details) => setSelectedTab(details.value)}
      variant="enclosed"
      fitted
      css={ORANGE_TABS_CSS}
    >
      <Tabs.List rounded="l3" p="1" bg="transparent">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            color="white"
            fontWeight="bold"
            _selected={{ bgColor: "orange.600" }}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
        <Tabs.Indicator rounded="l2" />
      </Tabs.List>

      {tabs.map((tab, index) => {
        const result = results[index];
        const isTabLoading =
          Boolean(result?.isLoading) ||
          (enabled && !result?.isError && Boolean(result?.isPending));
        const readyData =
          !isTabLoading &&
          !result?.isError &&
          result?.data !== undefined &&
          result?.data !== null
            ? result.data
            : undefined;
        const passed =
          readyData !== undefined && tab.getPassed
            ? tab.getPassed(readyData)
            : undefined;

        return (
          <Tabs.Content key={tab.value} value={tab.value}>
            <Box mt={4} minH="180px">
              <QueryStateView
                isLoading={isTabLoading}
                isError={Boolean(result?.isError)}
                error={result?.error ?? null}
                errorPrefix={`Error loading ${tab.value}`}
                loadingText="Calculating data points..."
                isEmpty={result?.data === undefined || result?.data === null}
                emptyText={`No ${tab.value} data available.`}
                minH="180px"
                spinnerSize="md"
              >
                {readyData !== undefined && (
                  <VStack align="stretch" gap={3}>
                    {passed !== undefined && (
                      <Badge
                        colorPalette={passed ? "green" : "yellow"}
                        width="fit-content"
                      >
                        {passed ? "HYPOTHESIS PASSED" : "HYPOTHESIS NOT PASSED"}
                      </Badge>
                    )}
                    {tab.render(readyData)}
                  </VStack>
                )}
              </QueryStateView>
            </Box>
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
}
