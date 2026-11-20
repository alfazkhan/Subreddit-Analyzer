import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { DATA_METHOD_CONTENT, THESIS_METADATA } from "@/data/aboutContent";
import { GlossaryTerm } from "./GlossaryTerm";
import type { RootState } from "@/util/Types";
import { LuCheck, LuX, LuDatabase, LuFilter, LuCpu } from "react-icons/lu";

export function DataMethodSection() {
  const latestSummary = useSelector(
    (state: RootState) => state.serverStatusState.latestSummary,
  );

  const activeCities = Object.keys(latestSummary || {}).length > 0
    ? Object.keys(latestSummary).sort()
    : ["amsterdam", "berlin", "delhi", "hongkong", "london", "losangeles", "mumbai", "munich", "nyc", "singapore", "toronto"];

  return (
    <Box id="section-data-method">
      <VStack align="stretch" gap={6}>
        <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800">
          Data and Method
        </Heading>

        {/* 1. The 7-Day Maturity Window */}
        <VStack align="start" gap={3}>
          <Heading as="h3" size="md" color="gray.100" fontWeight="medium">
            The 7-Day Maturity Window &amp; Equilibrium Principle
          </Heading>
          <Text color="gray.300" fontSize="md" lineHeight="1.8">
            {DATA_METHOD_CONTENT.maturityWindowExplanation}
          </Text>
        </VStack>

        {/* 2. What Is Stored vs. What Is Deliberately Excluded */}
        <Flex wrap="wrap" gap={4} width="full">
          <Box flex="1 1 calc(50% - 8px)" minW={{ base: "100%", md: "320px" }} bg="gray.950" p={5} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
            <HStack gap={2} mb={3}>
              <LuCheck color="#4ade80" size={18} />
              <Text fontSize="sm" fontWeight="bold" color="gray.100">
                Data Points Collected &amp; Stored
              </Text>
            </HStack>
            <VStack align="stretch" gap={2}>
              {DATA_METHOD_CONTENT.storedFields.map((item) => (
                <Box key={item.field} bg="whiteAlpha.50" p={2.5} borderRadius="md">
                  <Text fontSize="xs" fontWeight="semibold" color="orange.300">
                    {item.field}
                  </Text>
                  <Text fontSize="2xs" color="gray.400">
                    {item.detail}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>

          <Box flex="1 1 calc(50% - 8px)" minW={{ base: "100%", md: "320px" }} bg="gray.950" p={5} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
            <HStack gap={2} mb={3}>
              <LuX color="#f87171" size={18} />
              <Text fontSize="sm" fontWeight="bold" color="gray.100">
                Deliberately Excluded (Data Minimization)
              </Text>
            </HStack>
            <VStack align="stretch" gap={2}>
              {DATA_METHOD_CONTENT.deliberatelyExcludedFields.map((field) => (
                <HStack key={field} bg="whiteAlpha.50" p={2.5} borderRadius="md" align="flex-start" gap={2}>
                  <Text color="red.400" fontSize="xs" lineHeight="1">&times;</Text>
                  <Text fontSize="xs" color="gray.400" lineHeight="1.5">
                    {field}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Flex>

        {/* 3. The Cleaning Filter & Sample Size */}
        <Box bg="gray.950" p={5} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
          <VStack align="start" gap={3}>
            <HStack gap={2}>
              <LuFilter color="#f97316" size={18} />
              <Text fontSize="sm" fontWeight="bold" color="gray.100">
                Data Cleaning Filter &amp; Corpus Size
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.300" lineHeight="1.7">
              Raw posts in the PostgreSQL database undergo strict programmatic cleaning in <code>Scraping/database/kpis.py</code> before entering the statistical analysis engine:
            </Text>
            <VStack align="stretch" gap={1.5} width="full" pl={2}>
              {DATA_METHOD_CONTENT.cleaningFilters.map((filter) => (
                <HStack key={filter} gap={2}>
                  <Text color="orange.400" fontSize="xs">&bull;</Text>
                  <Text fontSize="xs" color="gray.400" fontFamily="mono">
                    {filter}
                  </Text>
                </HStack>
              ))}
            </VStack>
            <Box bg="blackAlpha.700" p={3} borderRadius="md" width="full" mt={1}>
              <Text fontSize="xs" color="gray.300">
                <strong>Thesis Frozen Snapshot:</strong> N = <strong>{THESIS_METADATA.snapshotSampleSize.toLocaleString("en-US")}</strong> verified submissions (frozen November 2026).
                The active database continues continuous headless ingestion and currently holds over 85,000 cleaned records.
              </Text>
            </Box>
          </VStack>
        </Box>

        {/* 4. Municipal Cities Covered */}
        <Box bg="gray.950" p={5} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
          <VStack align="start" gap={3}>
            <HStack justify="space-between" width="full" wrap="wrap">
              <HStack gap={2}>
                <LuDatabase color="#38bdf8" size={18} />
                <Text fontSize="sm" fontWeight="bold" color="gray.100">
                  Monitored Municipal Subreddits ({activeCities.length} cities)
                </Text>
              </HStack>
              <Badge variant="subtle" colorPalette="blue" size="xs">
                Dynamically Loaded from Server Summary
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.400">
              Cities are identified by IANA timezones and monitored for continuous topic and sentiment aggregation:
            </Text>
            <Flex wrap="wrap" gap={2}>
              {activeCities.map((city) => (
                <Badge key={city} colorPalette="orange" variant="outline" size="sm" px={2.5} py={1}>
                  r/{city.toLowerCase()}
                </Badge>
              ))}
            </Flex>
          </VStack>
        </Box>

        {/* 5. Local NLP Models & Derived Variables */}
        <VStack align="start" gap={3}>
          <HStack gap={2}>
            <LuCpu color="#c084fc" size={18} />
            <Heading as="h3" size="md" color="gray.100" fontWeight="medium">
              Multilingual NLP Models &amp; Derived Variables
            </Heading>
          </HStack>
          <Text fontSize="xs" color="gray.300" lineHeight="1.7">
            Models execute locally with PyTorch CUDA float16 acceleration, falling back to CPU float32 if GPU is unavailable:
          </Text>

          <Flex wrap="wrap" gap={3} width="full">
            {DATA_METHOD_CONTENT.nlpModels.map((item) => (
              <Box key={item.domain} flex="1 1 calc(50% - 6px)" minW={{ base: "100%", md: "320px" }} bg="gray.950" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" fontWeight="bold" color="orange.400">
                    {item.domain}
                  </Text>
                </HStack>
                <Text fontSize="2xs" color="gray.400" fontFamily="mono" mb={1.5}>
                  {item.model}
                </Text>
                <Text fontSize="xs" color="gray.300" lineHeight="1.6">
                  <strong>Derived Variables:</strong> {item.derivedVariables}
                </Text>
              </Box>
            ))}
          </Flex>
        </VStack>
      </VStack>
    </Box>
  );
}
