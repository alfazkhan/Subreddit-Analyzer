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
import {
  AUTHOR_FACTS,
  SHOW_SUPERVISORS,
  SUPERVISORS,
  THE_QUESTION,
  THESIS_CONTEXT,
  THESIS_METADATA,
} from "@/data/aboutContent";
import { GlossaryTerm } from "./GlossaryTerm";
import { LuArrowUpRight, LuGithub, LuLayoutDashboard } from "react-icons/lu";

export function AuthorThesisSection() {
  return (
    <VStack align="stretch" gap={10}>
      {/* 1. Header & Metadata Block */}
      <Box id="section-intro">
        <VStack align="start" gap={4}>
          <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800" width="full">
            Project Overview & Thesis Context
          </Heading>

          <Text color="gray.300" fontSize="md" lineHeight="1.8">
            An empirical data mining and computational linguistics platform investigating civic communication patterns,
            emotional affect, and thematic consensus across eleven metropolitan community subreddits.
          </Text>

          {/* Academic Metadata Banner */}
          <Box
            bg="gray.950"
            borderWidth="1px"
            borderColor="gray.800"
            borderRadius="lg"
            p={4}
            width="full"
          >
            <VStack align="start" gap={2}>
              <Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase" letterSpacing="wider">
                Academic Metadata
              </Text>
              <Text fontSize="sm" color="gray.200" fontWeight="medium">
                {THESIS_METADATA.degree} &bull; {THESIS_METADATA.institution}
              </Text>
              <HStack gap={4} wrap="wrap" fontSize="xs" color="gray.400">
                <Text>Target Submission: {THESIS_METADATA.submissionPeriod}</Text>
                <Text>&bull;</Text>
                <Text>Corpus Snapshot: {THESIS_METADATA.snapshotDate} (N = {THESIS_METADATA.snapshotSampleSize.toLocaleString("en-US")} posts)</Text>
              </HStack>
            </VStack>
          </Box>

          {/* Action Buttons */}
          <HStack gap={3} pt={1} wrap="wrap">
            <RouterLink to="/">
              <Button
                size="sm"
                bg="orange.600"
                color="white"
                _hover={{ bg: "orange.500" }}
                fontWeight="semibold"
              >
                <LuLayoutDashboard size={14} style={{ marginRight: "6px" }} />
                Open the dashboard
              </Button>
            </RouterLink>

            <a
              href={AUTHOR_FACTS.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                colorPalette="gray"
                borderColor="gray.700"
                color="gray.200"
                _hover={{ bg: "gray.850", borderColor: "gray.600" }}
              >
                <LuGithub size={14} style={{ marginRight: "6px" }} />
                View on GitHub
                <LuArrowUpRight size={12} style={{ marginLeft: "4px" }} />
              </Button>
            </a>
          </HStack>

          {/* Optional Supervisors (rendered only when SHOW_SUPERVISORS is true) */}
          {SHOW_SUPERVISORS && (
            <Box bg="gray.950" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.800" width="full" mt={2}>
              <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={2}>
                Academic Supervisors
              </Text>
              <VStack align="start" gap={1}>
                {SUPERVISORS.map((sup) => (
                  <Text key={sup.name} fontSize="xs" color="gray.300">
                    <strong>{sup.name}</strong> ({sup.role}) &mdash; {sup.institution}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>

      {/* 2. The Question */}
      <Box id="section-question">
        <VStack align="start" gap={4}>
          <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800" width="full">
            The Research Question
          </Heading>

          <Box bg="blackAlpha.600" borderLeftWidth="3px" borderColor="orange.500" p={4} borderRadius="md" width="full">
            <Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
              Master Thesis Title
            </Text>
            <Text fontSize="md" fontWeight="semibold" color="gray.100" lineHeight="1.6">
              &ldquo;{THESIS_METADATA.title}&rdquo;
            </Text>
          </Box>

          <Text color="gray.300" fontSize="md" lineHeight="1.8">
            {THE_QUESTION.paragraphs[0]}
          </Text>

          <Text color="gray.300" fontSize="md" lineHeight="1.8">
            {THE_QUESTION.paragraphs[1]} This dynamic connects directly to the{" "}
            <GlossaryTerm termId="attention-economy">attention economy</GlossaryTerm> and the emergence of{" "}
            <GlossaryTerm termId="civic-friction">civic friction</GlossaryTerm> in metropolitan governance.
          </Text>

          <Box bg="gray.950" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.800" width="full">
            <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
              Primary Research Question
            </Text>
            <Text fontSize="sm" color="gray.200" fontStyle="italic" lineHeight="1.7">
              {THE_QUESTION.researchQuestion}
            </Text>
          </Box>
        </VStack>
      </Box>

      {/* 3. About Me */}
      <Box id="section-about-me">
        <VStack align="start" gap={4}>
          <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800" width="full">
            About Me
          </Heading>

          <Text color="gray.300" fontSize="md" lineHeight="1.8">
            My name is <strong>{AUTHOR_FACTS.name}</strong>. I am an {AUTHOR_FACTS.degree} student at {AUTHOR_FACTS.institution}, with scheduled thesis submission in {AUTHOR_FACTS.thesisSubmission}.
          </Text>

          <Text color="gray.300" fontSize="md" lineHeight="1.8">
            {AUTHOR_FACTS.bio}
          </Text>

          {/* Quote Block: Why I built this */}
          <Box bg="gray.950" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.800" width="full">
            <Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
              Why I Built This (in my own words)
            </Text>
            <Text fontSize="sm" color="gray.300" fontStyle="italic" lineHeight="1.7">
              &ldquo;{AUTHOR_FACTS.whyIBuiltThis}&rdquo;
            </Text>
          </Box>

          {/* Contact and Links */}
          <Flex wrap="wrap" gap={3} pt={1} fontSize="xs">
            <Box bg="whiteAlpha.50" px={3} py={2} borderRadius="md" borderWidth="1px" borderColor="gray.800">
              <Text color="gray.400">Email: <code>{AUTHOR_FACTS.links.email}</code></Text>
            </Box>
            <Box bg="whiteAlpha.50" px={3} py={2} borderRadius="md" borderWidth="1px" borderColor="gray.800">
              <Text color="gray.400">GitHub: <a href={AUTHOR_FACTS.links.github} target="_blank" rel="noopener noreferrer" style={{ color: "#f97316" }}>{AUTHOR_FACTS.links.github}</a></Text>
            </Box>
            <Box bg="whiteAlpha.50" px={3} py={2} borderRadius="md" borderWidth="1px" borderColor="gray.800">
              <Text color="gray.400">LinkedIn: <code>{AUTHOR_FACTS.links.linkedin}</code></Text>
            </Box>
          </Flex>

          <Box bg="blackAlpha.500" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.850" width="full">
            <Text fontSize="xs" color="gray.400">
              <strong>H4 Re-run Status:</strong> {AUTHOR_FACTS.h4RerunStatus}
            </Text>
          </Box>
        </VStack>
      </Box>

      {/* 4. Why This Is My Master's Thesis */}
      <Box id="section-thesis">
        <VStack align="start" gap={4}>
          <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800" width="full">
            Why This Is My Master&apos;s Thesis
          </Heading>

          <Text color="gray.300" fontSize="md" lineHeight="1.8">
            {THESIS_CONTEXT.instrumentStatement} Building an automated analytical dashboard ensures full methodological transparency:
            every metric, classification, and regression can be inspected interactively rather than remaining hidden in static appendices.
          </Text>

          <VStack align="stretch" gap={3} width="full" pt={2}>
            {THESIS_CONTEXT.contributions.map((item, index) => (
              <Box key={item.title} bg="gray.950" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
                <HStack gap={2} mb={1}>
                  <Badge colorPalette="orange" variant="outline" size="xs">
                    Contribution {index + 1}
                  </Badge>
                  <Text fontSize="sm" fontWeight="bold" color="gray.200">
                    {item.title}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.400" lineHeight="1.7">
                  {item.description}
                </Text>
              </Box>
            ))}
          </VStack>
        </VStack>
      </Box>
    </VStack>
  );
}
