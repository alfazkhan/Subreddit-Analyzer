import { Box, Text } from "@chakra-ui/react";
import { TECH_STACK_CATEGORIES } from "@/data/aboutContent";
import { C, Section } from "./aboutUi";

export function TechStackSection() {
  return (
    <Section
      id="section-tech-stack"
      title="Tech stack"
      lede={
        <>
          Versions come from <code>package.json</code> and <code>Scraping/requirements.txt</code>.
        </>
      }
    >
      <Box display="grid" gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} columnGap={10} rowGap={10}>
        {TECH_STACK_CATEGORIES.map((cat) => (
          <Box key={cat.category}>
            <Text as="h3" fontSize="sm" fontWeight="semibold" color={C.accent} mb={3}>
              {cat.category}
            </Text>
            <Box as="ul" m={0} p={0} listStyleType="none" display="grid" gap={2}>
              {cat.technologies.map((tech) => (
                <Box as="li" key={tech.name} display="flex" justifyContent="space-between" gap={4} fontSize="sm">
                  <Text color="gray.200">
                    {tech.name}{" "}
                    <Text as="span" color={C.muted}>
                      · {tech.purpose}
                    </Text>
                  </Text>
                  {tech.version && (
                    <Text fontFamily="mono" fontSize="xs" color={C.muted} whiteSpace="nowrap" pt="2px">
                      {tech.version}
                    </Text>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Section>
  );
}
