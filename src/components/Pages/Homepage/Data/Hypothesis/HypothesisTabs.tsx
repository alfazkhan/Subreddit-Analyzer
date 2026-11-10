import { useState } from "react";
import { Badge, Box, Tabs, VStack } from "@chakra-ui/react";
import { useDownloadQuery } from "@/util/api";
import { QueryStateView } from "@/components/ui-components/Feedback";
import type { HypothesisTabDefinition } from "./KPIHelpers";

interface HypothesisTabsProps<TResponse> {
  tabs: HypothesisTabDefinition<TResponse>[];
  query: string;
  queryKey: readonly unknown[];
}

export default function HypothesisTabs<TResponse>({
  tabs,
  query,
  queryKey,
}: HypothesisTabsProps<TResponse>) {
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.value ?? "");
  const activeTab = tabs.find((tab) => tab.value === selectedTab) ?? tabs[0];
  const { data, isLoading, isError, error, downloadProgress } =
    useDownloadQuery<TResponse>({
      queryKey: [...queryKey, selectedTab],
      endpoint: `kpis/${selectedTab}?${query}`,
      enabled: Boolean(activeTab),
    });

  if (!activeTab) return null;

  return (
    <Tabs.Root
      value={selectedTab}
      onValueChange={(details) => setSelectedTab(details.value)}
      variant="enclosed"
      lazyMount
    >
      <Tabs.List overflowX="auto" gap={1}>
        {tabs.map((tab) => (
          <Tabs.Trigger key={tab.value} value={tab.value} color="white">
            {tab.label}
          </Tabs.Trigger>
        ))}
        <Tabs.Indicator />
      </Tabs.List>
      <Box mt={4} minH="180px">
        <QueryStateView
          isLoading={isLoading}
          isError={isError}
          error={error}
          errorPrefix={`Error loading ${selectedTab}`}
          loadingText={`Downloading ${selectedTab}...`}
          progress={downloadProgress}
          minH="180px"
          spinnerSize="md"
        >
          <VStack align="stretch" gap={3}>
            {activeTab.getPassed && (
              <Badge
                colorPalette={activeTab.getPassed(data as TResponse) ? "green" : "yellow"}
                width="fit-content"
              >
                {activeTab.getPassed(data as TResponse)
                  ? "HYPOTHESIS PASSED"
                  : "HYPOTHESIS NOT PASSED"}
              </Badge>
            )}
            {activeTab.render(data as TResponse)}
          </VStack>
        </QueryStateView>
      </Box>
    </Tabs.Root>
  );
}
