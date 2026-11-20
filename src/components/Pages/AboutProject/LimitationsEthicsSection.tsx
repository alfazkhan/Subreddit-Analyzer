import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { LIMITATIONS_ETHICS_CONTENT } from "@/data/aboutContent";
import { LuShieldCheck, LuTriangleAlert, LuArrowRight } from "react-icons/lu";

export function LimitationsEthicsSection() {
  return (
    <Box id="section-limitations-ethics">
      <VStack align="stretch" gap={6}>
        <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800">
          Limitations and Research Ethics
        </Heading>

        {/* Methodological Limitations */}
        <Box bg="gray.950" p={5} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
          <VStack align="start" gap={3}>
            <HStack gap={2}>
              <LuTriangleAlert color="#f59e0b" size={18} />
              <Heading as="h3" size="md" color="gray.100" fontWeight="medium">
                Methodological Limitations
              </Heading>
            </HStack>
            <Text fontSize="xs" color="gray.300" lineHeight="1.7">
              Honest academic inquiry requires explicit identification of observational and computational boundaries:
            </Text>
            <VStack align="stretch" gap={2} pl={2} width="full">
              {LIMITATIONS_ETHICS_CONTENT.limitations.map((lim, index) => (
                <HStack key={index} align="flex-start" gap={2}>
                  <Text color="orange.400" fontSize="xs" lineHeight="1.6">&bull;</Text>
                  <Text fontSize="xs" color="gray.400" lineHeight="1.6">
                    {lim}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </Box>

        {/* Research Ethics & Privacy Protections */}
        <Box bg="gray.950" p={5} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
          <VStack align="start" gap={3}>
            <HStack gap={2}>
              <LuShieldCheck color="#4ade80" size={18} />
              <Heading as="h3" size="md" color="gray.100" fontWeight="medium">
                Data Ethics, Privacy &amp; Platform Compliance
              </Heading>
            </HStack>
            <Text fontSize="xs" color="gray.300" lineHeight="1.7">
              Harvesting public social discussion requires rigorous data minimization and compliance with the EU General Data Protection Regulation (GDPR Art. 6(1)(f) and Art. 89):
            </Text>
            <VStack align="stretch" gap={2} pl={2} width="full">
              {LIMITATIONS_ETHICS_CONTENT.ethics.map((eth, index) => (
                <HStack key={index} align="flex-start" gap={2}>
                  <Text color="green.400" fontSize="xs" lineHeight="1.6">&bull;</Text>
                  <Text fontSize="xs" color="gray.400" lineHeight="1.6">
                    {eth}
                  </Text>
                </HStack>
              ))}
            </VStack>

            {/* Link to Privacy Policy */}
            <Box pt={2}>
              <RouterLink to="/privacy">
                <Button size="xs" variant="outline" colorPalette="orange" color="orange.400" borderColor="orange.500">
                  Read complete Privacy Policy (PRIVACY.md)
                  <LuArrowRight size={12} style={{ marginLeft: "4px" }} />
                </Button>
              </RouterLink>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
