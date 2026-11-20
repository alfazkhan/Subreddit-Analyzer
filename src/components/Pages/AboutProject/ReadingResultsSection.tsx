import {
  Box,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { READING_RESULTS_CONTENT } from "@/data/aboutContent";
import { GlossaryTerm } from "./GlossaryTerm";
import { LuBookOpen, LuScale } from "react-icons/lu";

export function ReadingResultsSection() {
  return (
    <Box id="section-reading-results">
      <VStack align="stretch" gap={5}>
        <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800">
          How to Read the Results: Statistical Rigor &amp; Interpretation
        </Heading>

        <Text color="gray.300" fontSize="md" lineHeight="1.8">
          Interpreting empirical computational social science requires distinguishing between statistical detection
          and substantive real-world significance. In big data research, standard statistical assumptions must be treated with caution.
        </Text>

        <VStack align="stretch" gap={4} pt={2}>
          {READING_RESULTS_CONTENT.paragraphs.map((para, index) => (
            <Box
              key={para.title}
              bg="gray.950"
              p={5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.800"
            >
              <HStack gap={2} mb={2}>
                <LuScale color="#f97316" size={16} />
                <Text fontSize="sm" fontWeight="bold" color="gray.100">
                  {index + 1}. {para.title}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.300" lineHeight="1.8">
                {para.text}
              </Text>
            </Box>
          ))}
        </VStack>

        <Box bg="blackAlpha.700" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.800" mt={2}>
          <Text fontSize="xs" color="gray.400" lineHeight="1.6">
            <strong>Key Takeaway:</strong> High statistical confidence (tiny <GlossaryTerm termId="p-value">p-values</GlossaryTerm>) guarantees that patterns in this 51,587-post corpus are not random noise. However, the magnitude of the <GlossaryTerm termId="effect-size">effect size</GlossaryTerm> determines whether an observed pattern truly shapes municipal community attention.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
