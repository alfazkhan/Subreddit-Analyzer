import { useState } from "react";
import { Badge, Box, Center, Progress, Spinner, Tabs, Text, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
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
  const [downloadProgress, setDownloadProgress] = useState(0);
  const activeTab = tabs.find((tab) => tab.value === selectedTab) ?? tabs[0];
  const { data, isLoading, isError, error } = useQuery<TResponse>({
    queryKey: [...queryKey, selectedTab],
    queryFn: ({ signal }) => {
      setDownloadProgress(0);
      return fetchingData({
        endpoint: `kpis/${selectedTab}?${query}`,
        signal,
        progressCallBackFn: setDownloadProgress,
      });
    },
    enabled: Boolean(activeTab),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
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
        {isLoading ? (
          <Center minH="180px">
            <VStack gap={2}>
              <Spinner color="orange.500" />
              <Progress.Root
                value={downloadProgress}
                width="min(100%, 360px)"
                colorPalette="orange"
                size="sm"
              >
                <Progress.Track>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
              <Text fontSize="sm" color="gray.400">
                Downloading {selectedTab}... {downloadProgress}%
              </Text>
            </VStack>
          </Center>
        ) : isError ? (
          <Text color="red.400" fontSize="sm">
            Error loading {selectedTab}: {error.message}
          </Text>
        ) : (
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
        )}
      </Box>
    </Tabs.Root>
  );
}
