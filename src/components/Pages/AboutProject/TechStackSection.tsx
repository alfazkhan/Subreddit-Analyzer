import {
  Badge,
  Box,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { TECH_STACK_CATEGORIES } from "@/data/aboutContent";

export function TechStackSection() {
  return (
    <Box id="section-tech-stack">
      <VStack align="stretch" gap={6}>
        <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800">
          Technology Stack
        </Heading>

        <Text color="gray.300" fontSize="md" lineHeight="1.8">
          All libraries, runtimes, and models deployed across the ingestion crawler, offline neural pipeline,
          and web dashboard. Sourced directly from <code>package.json</code> and <code>Scraping/requirements.txt</code>.
        </Text>

        <VStack align="stretch" gap={5} width="full">
          {TECH_STACK_CATEGORIES.map((cat) => (
            <Box
              key={cat.category}
              bg="gray.950"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.800"
              overflow="hidden"
            >
              <Box p={3.5} bg="gray.900" borderBottomWidth="1px" borderColor="gray.800">
                <Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase" letterSpacing="wider">
                  {cat.category}
                </Text>
              </Box>

              <Box overflowX="auto">
                <Box as="table" width="full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                      <th style={{ padding: "8px 14px", textAlign: "left", fontSize: "11px", color: "#9ca3af", width: "35%" }}>
                        Technology &amp; Version
                      </th>
                      <th style={{ padding: "8px 14px", textAlign: "left", fontSize: "11px", color: "#9ca3af" }}>
                        Role in System &amp; Source
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.technologies.map((tech) => (
                      <tr key={tech.name} style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        <td style={{ padding: "10px 14px", verticalAlign: "top" }}>
                          <Text fontSize="xs" fontWeight="bold" color="gray.200">
                            {tech.name}
                          </Text>
                          {tech.version && (
                            <Text fontSize="2xs" color="gray.500" fontFamily="mono">
                              v{tech.version}
                            </Text>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px", verticalAlign: "top" }}>
                          <Text fontSize="xs" color="gray.300" lineHeight="1.5">
                            {tech.purpose}
                          </Text>
                          <Text fontSize="2xs" color="gray.500" fontFamily="mono" mt={0.5}>
                            Source: {tech.source}
                          </Text>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
}
