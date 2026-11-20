import { Box, Container } from "@chakra-ui/react";
import type { AboutProjectProps } from "@/util/Types";
import { PageToc } from "./PageToc";
import { AboutMeSection, ProjectHero, QuestionSection } from "./AuthorThesisSection";
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
    <Container maxW="6xl" py={{ base: 8, md: 14 }} px={{ base: 5, md: 8 }}>
      <ProjectHero />

      <Box
        display="grid"
        gridTemplateColumns={{ base: "minmax(0, 1fr)", lg: "190px minmax(0, 1fr)" }}
        gap={{ base: 8, lg: 16 }}
        alignItems="start"
        mt={{ base: 10, md: 16 }}
      >
        <PageToc />

        <Box
          display="flex"
          flexDirection="column"
          gap={{ base: 16, md: 20 }}
          maxW="760px"
          minW={0}
        >
          <QuestionSection />
          <HypothesesSection />
          <ReadingResultsSection />
          <PlatformSection />
          <SystemArchitectureSection />
          <DataMethodSection />
          <LimitationsEthicsSection />
          <AboutMeSection />
          <TerminologySection />
          <TechStackSection />
        </Box>
      </Box>
    </Container>
  );
}
