import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Text,
} from "@chakra-ui/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link as RouterLink } from "react-router-dom";
import privacyMarkdown from "../../../../PRIVACY.md?raw";
import { openConsentBanner } from "@/util/analyticsConsent";
import { Header } from "@/components/ui-components/Layout";

export default function PrivacyPolicy() {
  return (
    <Container maxW="4xl" py={10} px={{ base: 4, md: 8 }}>
      <Flex direction="column" gap={6}>
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Header text="Privacy Policy" highlight="Policy" />
          <RouterLink to="/">
            <Button
              size="sm"
              variant="outline"
              colorPalette="orange"
              color="orange.400"
              borderColor="orange.500"
            >
              Back to Home
            </Button>
          </RouterLink>
        </Flex>

        <Box
          bg="gray.900"
          p={{ base: 6, md: 10 }}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.800"
          boxShadow="lg"
        >
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <Heading
                  as="h1"
                  size="2xl"
                  color="orange.500"
                  mt={4}
                  mb={4}
                  fontWeight="bold"
                >
                  {children}
                </Heading>
              ),
              h2: ({ children }) => (
                <Heading
                  as="h2"
                  size="xl"
                  color="orange.400"
                  mt={8}
                  mb={4}
                  pb={2}
                  borderBottom="1px solid"
                  borderColor="gray.800"
                  fontWeight="semibold"
                >
                  {children}
                </Heading>
              ),
              h3: ({ children }) => (
                <Heading
                  as="h3"
                  size="md"
                  color="gray.100"
                  mt={6}
                  mb={2}
                  fontWeight="medium"
                >
                  {children}
                </Heading>
              ),
              p: ({ children }) => (
                <Text
                  color="gray.300"
                  fontSize="md"
                  lineHeight="1.8"
                  mb={4}
                >
                  {children}
                </Text>
              ),
              ul: ({ children }) => (
                <Box as="ul" pl={6} mb={4} color="gray.300">
                  {children}
                </Box>
              ),
              ol: ({ children }) => (
                <Box as="ol" pl={6} mb={4} color="gray.300">
                  {children}
                </Box>
              ),
              li: ({ children }) => (
                <Box as="li" mb={2} lineHeight="1.7">
                  {children}
                </Box>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  style={{
                    color: "#f97316",
                    textDecoration: "underline",
                  }}
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href?.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                >
                  {children}
                </a>
              ),
              hr: () => (
                <Box as="hr" borderColor="gray.800" my={8} borderWidth="1px" />
              ),
              blockquote: ({ children }) => (
                <Box
                  as="blockquote"
                  pl={4}
                  py={1}
                  borderLeft="3px solid"
                  borderColor="orange.500"
                  my={4}
                  bg="gray.850"
                  color="gray.400"
                >
                  {children}
                </Box>
              ),
              code: ({ children }) => (
                <Box
                  as="code"
                  px={1.5}
                  py={0.5}
                  bg="gray.800"
                  color="orange.300"
                  borderRadius="md"
                  fontSize="0.9em"
                  fontFamily="mono"
                >
                  {children}
                </Box>
              ),
              table: ({ children }) => (
                <Box overflowX="auto" my={4} borderWidth="1px" borderColor="gray.800" borderRadius="md">
                  <Box as="table" width="full">
                    {children}
                  </Box>
                </Box>
              ),
              th: ({ children }) => (
                <Box
                  as="th"
                  p={3}
                  bg="gray.800"
                  color="gray.200"
                  borderBottom="1px solid"
                  borderColor="gray.700"
                  textAlign="left"
                  fontWeight="semibold"
                >
                  {children}
                </Box>
              ),
              td: ({ children }) => (
                <Box
                  as="td"
                  p={3}
                  borderBottom="1px solid"
                  borderColor="gray.800"
                  color="gray.300"
                >
                  {children}
                </Box>
              ),
            }}
          >
            {privacyMarkdown}
          </Markdown>

          <Box
            mt={12}
            pt={8}
            borderTop="1px solid"
            borderColor="gray.800"
            textAlign="center"
          >
            <HStack justify="center" gap={4} flexWrap="wrap">
              <Button
                size="md"
                variant="outline"
                colorPalette="orange"
                color="orange.400"
                borderColor="orange.500"
                _hover={{ bg: "orange.950" }}
                fontWeight="semibold"
                onClick={openConsentBanner}
              >
                Manage Analytics Preferences
              </Button>
            </HStack>
          </Box>
        </Box>
      </Flex>
    </Container>
  );
}
