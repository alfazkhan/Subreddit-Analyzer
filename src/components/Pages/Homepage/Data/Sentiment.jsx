import {  HStack, Text, Flex } from "@chakra-ui/react";

export default function Sentiment({ data,  }) {
  const sentimentCounts = {
    Positive: 0,
    Neutral: 0,
    Negative: 0,
  };

  if (data && Array.isArray(data)) {
    data.forEach((post) => {
      if (sentimentCounts[post.sentiment] !== undefined) {
        sentimentCounts[post.sentiment]++;
      }
    });
  }

  const total = data?.length || 0;

  const config = {
    Positive: { emoji: "😊", color: "#4ade80", label: "Positive" },
    Neutral: { emoji: "😐", color: "#94a3b8", label: "Neutral" },
    Negative: { emoji: "😠", color: "#f87171", label: "Negative" },
  };

  if (total === 0) {
    return (
      <Flex justifyContent="center" padding={10}>
        <Text color="whiteAlpha.600">Waiting for Data...</Text>
      </Flex>
    );
  }

  return (
    <Flex gap="4" width="full" direction="column">
      <HStack width="full" justifyContent="space-around" gap="4">
        {Object.keys(sentimentCounts).map((emotion) => {
          // Calculate actual percentage
          const percentage = total > 0 
            ? ((sentimentCounts[emotion] / total) * 100).toFixed(0) 
            : 0;

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
                {sentimentCounts[emotion]} posts
              </Text>
            </Flex>
          );
        })}
      </HStack>
    </Flex>
  );
}