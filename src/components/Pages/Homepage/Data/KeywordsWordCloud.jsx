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

export default function KeywordsWordCloud({ data }) {
  const [minValue, setMinValue] = useState(10);
  const [maxValue, setMaxValue] = useState(10000);
  const [stopWordsStr, setStopWordsStr] = useState("");
  const [limit, setLimit] = useState(100);

  const processedCloudData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const customStopWords = stopWordsStr
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const keywordMap = {};

    // Tokenize text and count frequencies
    data.forEach((post) => {
      const text = `${post.title || ""} ${post.body || ""}`.toLowerCase();
      // Extract words with 3 or more alphabetical characters
      const words = text.match(/\b[a-z]{3,}\b/g) || [];

      words.forEach((word) => {
        // Exclude only the specific words the user types in the input
        if (customStopWords.includes(word)) return;

        if (!keywordMap[word]) {
          keywordMap[word] = 0;
        }
        keywordMap[word] += 1;
      });
    });

    const entries = [];
    for (const [word, count] of Object.entries(keywordMap)) {
      if (count >= minValue && count <= maxValue) {
        entries.push({ word, count });
      }
    }

    // Sort descending by count
    entries.sort((a, b) => b.count - a.count);

    // Apply strict limit to prevent DOM overload
    return entries.slice(0, limit);
  }, [data, minValue, maxValue, stopWordsStr, limit]);

  const currentMaxValue = processedCloudData.length > 0 ? processedCloudData[0].count : 1;

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

      <HStack gap={4} alignItems="flex-start" wrap="wrap">
        <Field.Root width="auto">
          <Field.Label fontSize="xs" color="whiteAlpha.700">Min Frequency</Field.Label>
          <NumberInput.Root
            value={minValue}
            allowMouseWheel
            onValueChange={(details) => setMinValue(details.valueAsNumber)}
            size="sm"
            color="white"
            maxW="100px"
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
        </Field.Root>

        <Field.Root width="auto">
          <Field.Label fontSize="xs" color="whiteAlpha.700">Max Frequency</Field.Label>
          <NumberInput.Root
            value={maxValue}
            allowMouseWheel
            onValueChange={(details) => setMaxValue(details.valueAsNumber)}
            size="sm"
            color="white"
            maxW="100px"
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
        </Field.Root>

        <Field.Root width="auto">
          <Field.Label fontSize="xs" color="whiteAlpha.700">Word Limit</Field.Label>
          <NumberInput.Root
            value={limit}
            allowMouseWheel
            onValueChange={(details) => setLimit(details.valueAsNumber)}
            size="sm"
            color="white"
            min={1}
            max={300}
            maxW="100px"
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
          {processedCloudData.length === 0 ? (
            <Text color="gray.500">No keywords to display.</Text>
          ) : (
            processedCloudData.map((item) => {
              // Calculate fluid typography based on weight relative to the highest count
              const weightRatio = item.count / currentMaxValue;
              const fontSize = 12 + weightRatio * 48; 
              const opacity = 0.4 + weightRatio * 0.6; 

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
                  title={`Count: ${item.count}`}
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