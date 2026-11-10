import { HStack, Text, Flex, Badge } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/api";
import { SENTIMENT_DISPLAY_CONFIG } from "@/util/constants";
import { QueryStateView } from "@/components/ui-components/Feedback";
import type { SentimentAnalyticsResponse, SentimentLabel } from "@/util/Types";

export default function Sentiment({ subreddit = "All" }) {
  const queryParam = subreddit && subreddit !== "All" ? `?subreddit=${encodeURIComponent(subreddit)}` : "";

  const { data, isLoading, isError, error } = useQuery<SentimentAnalyticsResponse>({
    queryKey: ["subreddits-sentiment", subreddit],
    queryFn: ({ signal }) => fetchingData({ endpoint: `subreddits/sentiments${queryParam}`, signal }),
  });

  // Use overall or specific subreddit from response
  const activeStats = data?.overall || {
    total_posts: 0,
    counts: { Positive: 0, Neutral: 0, Negative: 0 },
    percentages: { Positive: 0, Neutral: 0, Negative: 0 },
  };

  const total = activeStats.total_posts || 0;

  return (
    <QueryStateView
      isLoading={isLoading}
      isError={isError}
      error={error}
      errorPrefix="Failed to load sentiments"
      height="180px"
      spinnerSize="lg"
      isEmpty={total === 0}
      emptyText="No sentiment records found."
    >
      <Flex gap="4" width="full" direction="column">
        <Flex justify="space-between" align="center" px={2}>
          <Text fontSize="xs" color="gray.400">
            Analyzed Scope: <strong>{subreddit}</strong> ({total.toLocaleString()} posts)
          </Text>
          <Badge colorPalette="orange" variant="outline" fontSize="xs">
            Cross-City Aggregated
          </Badge>
        </Flex>

        <HStack width="full" justifyContent="space-around" gap="4">
          {(Object.keys(SENTIMENT_DISPLAY_CONFIG) as SentimentLabel[]).map((emotion) => {
            const count = activeStats.counts?.[emotion] || 0;
            const percentage = activeStats.percentages?.[emotion] || 0;
            const meta = SENTIMENT_DISPLAY_CONFIG[emotion];

            return (
              <Flex
                key={emotion}
                flex="1"
                flexDirection="column"
                alignItems="center"
                borderRadius="xl"
                borderWidth="2px"
                borderBottomWidth="7px"
                borderColor={meta.color}
                padding={5}
                cursor="pointer"
                _hover={{ bg: "whiteAlpha.100" }}
                transition="all 0.15s"
              >
                <Text fontSize="6xl">{meta.emoji}</Text>
                <Text fontSize="2xl" fontWeight="extrabold" color="white">
                  {meta.label}
                </Text>
                <Text
                  fontSize="3xl"
                  fontWeight="black"
                  color={meta.color}
                >
                  {percentage}%
                </Text>
                <Text fontSize="sm" color="whiteAlpha.500">
                  {count.toLocaleString()} posts
                </Text>
              </Flex>
            );
          })}
        </HStack>
      </Flex>
    </QueryStateView>
  );
}