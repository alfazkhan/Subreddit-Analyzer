import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { HYPOTHESES_PILLARS, THESIS_METADATA } from "@/data/aboutContent";
import { HypothesisCard } from "./HypothesisCard";
import { LuChevronDown, LuChevronUp, LuExternalLink, LuLayers } from "react-icons/lu";

export function HypothesesSection() {
  // Track open state for each pillar accordion
  const [openPillars, setOpenPillars] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });

  const allOpen = Object.values(openPillars).every(Boolean);

  const toggleAll = () => {
    const nextState = !allOpen;
    setOpenPillars({
      1: nextState,
      2: nextState,
      3: nextState,
      4: nextState,
    });
  };

  const togglePillar = (id: number) => {
    setOpenPillars((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box id="section-hypotheses">
      <VStack align="stretch" gap={6}>
        <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} wrap="wrap" gap={3} pb={2} borderBottom="1px solid" borderColor="gray.800">
          <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold">
            Hypotheses: Four Pillars &amp; Seven Tests
          </Heading>

          <HStack gap={3}>
            <Button
              size="xs"
              variant="outline"
              colorPalette="gray"
              onClick={toggleAll}
              color="gray.300"
              borderColor="gray.700"
            >
              {allOpen ? (
                <>
                  <LuChevronUp size={14} style={{ marginRight: "4px" }} />
                  Collapse all
                </>
              ) : (
                <>
                  <LuChevronDown size={14} style={{ marginRight: "4px" }} />
                  Expand all
                </>
              )}
            </Button>

            <RouterLink to="/#kpis">
              <Button size="xs" variant="ghost" color="orange.400" _hover={{ bg: "whiteAlpha.50" }}>
                Live KPI Tab
                <LuExternalLink size={12} style={{ marginLeft: "4px" }} />
              </Button>
            </RouterLink>
          </HStack>
        </Flex>

        {/* Snapshot Notice Banner */}
        <Box bg="gray.950" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
          <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} wrap="wrap" gap={2}>
            <HStack gap={2}>
              <Badge colorPalette="orange" variant="solid" size="xs">
                Snapshot, Nov 2026
              </Badge>
              <Text fontSize="xs" color="gray.300">
                Frozen Master&apos;s Thesis Dataset: N = <strong>{THESIS_METADATA.snapshotSampleSize.toLocaleString("en-US")}</strong> posts &bull; Alpha α = <strong>{THESIS_METADATA.alphaLevel}</strong>
              </Text>
            </HStack>
            <Text fontSize="2xs" color="gray.500">
              Backend code (<code>Scraping/database/kpis.py</code>) represents the source of truth.
            </Text>
          </Flex>
        </Box>

        {/* Pillars Accordion Stack */}
        <VStack align="stretch" gap={5}>
          {HYPOTHESES_PILLARS.map((pillar) => {
            const isOpen = openPillars[pillar.id];
            return (
              <Box
                key={pillar.id}
                borderWidth="1px"
                borderColor="gray.800"
                borderRadius="xl"
                overflow="hidden"
                bg="gray.900"
              >
                {/* Accordion Header */}
                <Flex
                  justify="space-between"
                  align="center"
                  p={4}
                  bg="gray.950"
                  cursor="pointer"
                  onClick={() => togglePillar(pillar.id)}
                  _hover={{ bg: "gray.850" }}
                  transition="background-color 150ms ease"
                >
                  <HStack gap={3}>
                    <LuLayers color="#f97316" size={18} />
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.100">
                        {pillar.title}
                      </Text>
                      <Text fontSize="2xs" color="gray.400">
                        {pillar.subtitle} &bull; {pillar.hypotheses.length} {pillar.hypotheses.length === 1 ? "hypothesis" : "hypotheses"}
                      </Text>
                    </Box>
                  </HStack>

                  <Button size="xs" variant="ghost" color="gray.400" aria-label={isOpen ? "Collapse pillar" : "Expand pillar"}>
                    {isOpen ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
                  </Button>
                </Flex>

                {/* Accordion Content */}
                {isOpen && (
                  <VStack align="stretch" gap={5} p={{ base: 4, md: 5 }}>
                    {pillar.hypotheses.map((hypothesis) => (
                      <HypothesisCard key={hypothesis.id} hypothesis={hypothesis} />
                    ))}
                  </VStack>
                )}
              </Box>
            );
          })}
        </VStack>
      </VStack>
    </Box>
  );
}
