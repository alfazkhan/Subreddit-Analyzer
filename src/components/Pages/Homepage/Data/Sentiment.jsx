import { HStack, Text, Flex, Spinner, Center, Badge } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";

const config = {
  Positive: { emoji: "😊", color: "#4ade80", label: "Positive" },
  Neutral: { emoji: "😐", color: "#94a3b8", label: "Neutral" },
  Negative: { emoji: "😠", color: "#f87171", label: "Negative" },
};

export default function Sentiment({ subreddit = "All" }) {
  const queryParam = subreddit && subreddit !== "All" ? `?subreddit=${encodeURIComponent(subreddit)}` : "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["subreddits-sentiment", subreddit],
    queryFn: ({ signal }) => fetchingData({ endpoint: `subreddits/sentiments${queryParam}`, signal }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <Center height="180px" width="full">
        <Spinner size="lg" color="orange.500" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center height="180px" width="full">
        <Text color="red.400" fontSize="sm">
          Failed to load sentiments: {error?.message || "Server Error"}
        </Text>
      </Center>
    );
  }

  // Use overall or specific subreddit from response
  const activeStats = data?.overall || {
    total_posts: 0,
    counts: { Positive: 0, Neutral: 0, Negative: 0 },
    percentages: { Positive: 0, Neutral: 0, Negative: 0 },
  };

  const total = activeStats.total_posts || 0;

  if (total === 0) {
    return (
      <Flex justifyContent="center" padding={10}>
        <Text color="whiteAlpha.600">No sentiment records found.</Text>
      </Flex>
    );
  }

  return (
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
        {["Positive", "Neutral", "Negative"].map((emotion) => {
          const count = activeStats.counts?.[emotion] || 0;
          const percentage = activeStats.percentages?.[emotion] || 0;

          return (
            <Flex
              key={emotion}
              flex="1"
              flexDirection="column"
              alignItems="center"
              borderRadius="xl"
              borderWidth="2px"
              borderBottomWidth="7px"
              borderColor={config[emotion].color}
              padding={5}
              cursor="pointer"
              _hover={{ bg: "whiteAlpha.100" }}
              transition="all 0.15s"
            >
              <Text fontSize="6xl">{config[emotion].emoji}</Text>
              <Text fontSize="2xl" fontWeight="extrabold" color="white">
                {config[emotion].label}
              </Text>
              <Text
                fontSize="3xl"
                fontWeight="black"
                color={config[emotion].color}
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
  );
}