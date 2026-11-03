import { useMemo, useState } from "react";
import {
  Flex,
  Box,
  Text,
  HStack,
  Field,
  NumberInput,
  Input,
  Heading,
} from "@chakra-ui/react";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import { fetchingData } from "@/util/http";
import { useQuery } from "@tanstack/react-query";
import type { KeywordItem } from "@/util/Types";

export default function KeywordsWordCloud() {
  const {
    data: keywords = [],
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery<KeywordItem[]>({
    queryKey: ["keywords"],
    queryFn: ({ signal }) =>
      fetchingData({ endpoint: "posts/keywords", signal }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });


  const currentMaxValue = useMemo(() => {
    let max = 0;
    keywords.forEach((element) => {
      if (element.frequency > max) {
        max = element.frequency;
      }
    });
    return max;
  }, [keywords]);

  if (isError || isPending || isLoading) {
    return (
      <LoadingAndError isLoading={isPending} isError={isError} error={error} />
    );
  }

  return (
    <Flex
      direction="column"
      gap={4}
      p={6}
      bg="blackAlpha.400"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      minH="500px"
    >
      <Heading size="md" color="orange.600" mb={2}>
        Keyword Cloud
      </Heading>

      <Box
        flex="1"
        mt={4}
        p={6}
        borderWidth="1px"
        borderColor="whiteAlpha.100"
        borderRadius="md"
        bg="blackAlpha.600"
        overflowY="auto"
        minH="350px"
      >
        <Flex
          h="100%"
          w="100%"
          flexWrap="wrap"
          justifyContent="center"
          alignContent="center"
          gap={4}
        >
          {keywords.length === 0 ? (
            <Text color="gray.500">No keywords to display.</Text>
          ) : (
            keywords.map((item) => {
              // Calculate fluid typography based on weight relative to the highest count
              const weightRatio = item.frequency / currentMaxValue;
              const fontSize = 12 + weightRatio * 48;
              const opacity = 0.4 + weightRatio * 0.6;

              if (!item.reported) {
                return null;
              }

              return (
                <Text
                  key={item.word}
                  fontSize={`${fontSize}px`}
                  fontWeight={weightRatio > 0.5 ? "900" : "500"}
                  lineHeight="1"
                  color="orange.400"
                  opacity={opacity}
                  transition="transform 0.2s"
                  _hover={{
                    transform: "scale(1.1)",
                    opacity: 1,
                    color: "orange.300",
                    cursor: "default",
                  }}
                  title={`Count: ${item.frequency}`}
                >
                  {item.word}
                </Text>
              );
            })
          )}
        </Flex>
      </Box>
    </Flex>
  );
}
