import { Box, Container, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import type { AboutProjectProps } from "@/util/Types";
import { PageToc } from "./PageToc";
import { AuthorThesisSection } from "./AuthorThesisSection";
import { PlatformSection } from "./PlatformSection";
import { SystemArchitectureSection } from "./SystemArchitectureSection";
import { DataMethodSection } from "./DataMethodSection";
import { HypothesesSection } from "./Hypotheses/HypothesesSection";
import { ReadingResultsSection } from "./ReadingResultsSection";
import { TerminologySection } from "./TerminologySection";
import { LimitationsEthicsSection } from "./LimitationsEthicsSection";
import { TechStackSection } from "./TechStackSection";

export default function AboutProject({}: AboutProjectProps) {
  return (
    <Container maxW="7xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 8 }}>
      <Flex direction="column" gap={8}>
        {/* Main Header with the single H1 on the page */}
        <Box borderBottom="1px solid" borderColor="gray.800" pb={6}>
          <Heading
            as="h1"
            size="2xl"
            color="orange.500"
            fontWeight="bold"
            mb={2}
          >
            About The Project
          </Heading>
          <Text color="gray.400" fontSize="md">
            Master&apos;s Thesis Research: Computational Social Science, Multilingual NLP &amp; Civic Discourse Dynamics
          </Text>
        </Box>

        {/* Two-Column Responsive Layout: Prose Column (~70ch) + Sticky TOC */}
        <Flex
          direction={{ base: "column", lg: "row" }}
          gap={{ base: 8, lg: 12 }}
          align="flex-start"
          justify="space-between"
          width="full"
        >
          {/* Main Reading Column */}
          <Box
            flex="1"
            maxW={{ base: "100%", lg: "800px" }}
            bg="gray.900"
            p={{ base: 5, md: 8, lg: 10 }}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.800"
            boxShadow="lg"
          >
            <VStack align="stretch" gap={12}>
              {/* Sections 1–4: Overview, The Question, About Me, Master's Thesis Context */}
              <AuthorThesisSection />

              {/* Section 5: What the Platform Does (Screenshots & Lightbox) */}
              <PlatformSection />

              {/* Section 6: How It Works (SVG Architecture Pipeline Diagram) */}
              <SystemArchitectureSection />

              {/* Section 7: Data and Method (7-Day Window, Cleaning, Derived Variables) */}
              <DataMethodSection />

              {/* Section 8: The Seven Empirical Hypotheses Across Four Pillars */}
              <HypothesesSection />

              {/* Section 9: How to Read the Results (P-values, Effect Sizes, Examples) */}
              <ReadingResultsSection />

              {/* Section 10: Searchable Glossary of Terms */}
              <TerminologySection />

              {/* Section 11: Methodological Limitations & Research Ethics */}
              <LimitationsEthicsSection />

              {/* Section 12: Technology Stack Table */}
              <TechStackSection />
            </VStack>
          </Box>

          {/* Sticky Table of Contents (Desktop sidebar + Mobile dropdown) */}
          <PageToc />
        </Flex>
      </Flex>
    </Container>
  );
}
