import { Box, Text } from "@chakra-ui/react";
import { READING_RESULTS_CONTENT } from "@/data/aboutContent";
import { GlossaryTerm } from "./GlossaryTerm";
import { C, P, Section } from "./aboutUi";

export function ReadingResultsSection() {
  return (
    <Section
      id="section-reading-results"
      title="Reading the numbers"
      lede="Four things to keep in mind when reading the results above."
    >
      <Box as="ol" m={0} p={0} listStyleType="none" display="grid" gap={7}>
        {READING_RESULTS_CONTENT.paragraphs.map((para, index) => (
          <Box as="li" key={para.title} display="grid" gridTemplateColumns="28px 1fr" gap={3}>
            <Text fontSize="sm" fontWeight="semibold" color={C.accent} lineHeight="1.9" fontVariantNumeric="tabular-nums">
              {index + 1}
            </Text>
            <Box>
              <Text as="h3" fontSize="lg" fontWeight="semibold" color={C.heading} mb={1}>
                {para.title}
              </Text>
              <P>{para.text}</P>
            </Box>
          </Box>
        ))}
      </Box>

      <P mt={8} pl={5} borderLeftWidth="3px" borderColor="orange.400" color="gray.200">
        In short: a tiny <GlossaryTerm termId="p-value">p-value</GlossaryTerm> means a pattern is real. The{" "}
        <GlossaryTerm termId="effect-size">effect size</GlossaryTerm> tells you whether it's big enough to care about.
      </P>
    </Section>
  );
}
