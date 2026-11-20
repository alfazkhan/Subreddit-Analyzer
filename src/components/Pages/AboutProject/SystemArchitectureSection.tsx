import { Box, Text } from "@chakra-ui/react";
import { PIPELINE_STEPS } from "@/data/aboutContent";
import { GlossaryTerm } from "./GlossaryTerm";
import { C, Section } from "./aboutUi";

export function SystemArchitectureSection() {
  return (
    <Section
      id="section-architecture"
      title="How it works"
      lede={
        <>
          Posts go through five steps, from Reddit to the dashboard. The key one is a{" "}
          <GlossaryTerm termId="maturity-window">7-day wait</GlossaryTerm> before anything is measured, and the{" "}
          <GlossaryTerm termId="nlp-pipeline">language analysis</GlossaryTerm> runs entirely on local hardware.
        </>
      }
    >
      <Box as="ol" m={0} p={0} listStyleType="none" aria-label="Data pipeline steps">
        {PIPELINE_STEPS.map((step, index) => {
          const isLast = index === PIPELINE_STEPS.length - 1;
          return (
            <Box as="li" key={step.stepNumber} display="grid" gridTemplateColumns="36px 1fr" columnGap={4}>
              {/* Number + connector line */}
              <Box display="flex" flexDirection="column" alignItems="center">
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="orange.400"
                  color="orange.300"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="sm"
                  fontWeight="semibold"
                  flexShrink={0}
                  aria-hidden="true"
                >
                  {step.stepNumber}
                </Box>
                {!isLast && <Box flex="1" w="1px" bg={C.line} my={1} />}
              </Box>

              <Box pb={isLast ? 0 : 7} pt="3px">
                <Box display="flex" flexWrap="wrap" alignItems="baseline" columnGap={3} rowGap={1} mb={1}>
                  <Text as="h3" fontSize="lg" fontWeight="semibold" color={C.heading}>
                    {step.title}
                  </Text>
                  <Text fontFamily="mono" fontSize="xs" color={C.muted}>
                    {step.system}
                  </Text>
                </Box>
                <Text color={C.text} lineHeight="1.7" maxW="64ch">
                  {step.description}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Section>
  );
}
