import React, { useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { GLOSSARY_ITEMS } from "@/data/aboutContent";

interface GlossaryTermProps {
  termId: string;
  children: React.ReactNode;
}

export function GlossaryTerm({ termId, children }: GlossaryTermProps) {
  const [isOpen, setIsOpen] = useState(false);
  const entry = GLOSSARY_ITEMS.find((item) => item.id === termId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const targetElement = document.getElementById(`glossary-${termId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      targetElement.focus();
    }
  };

  if (!entry) {
    return <span>{children}</span>;
  }

  return (
    <Box
      as="span"
      position="relative"
      display="inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <Box
        as="a"
        href={`#glossary-${termId}`}
        onClick={handleClick}
        borderBottom="1px dotted"
        borderColor="orange.400"
        color="inherit"
        textDecoration="none"
        cursor="help"
        tabIndex={0}
        aria-label={`${entry.term}: ${entry.plainDefinition}. Click to jump to glossary entry.`}
        aria-describedby={`tooltip-${termId}`}
        _hover={{ color: "orange.300", borderColor: "orange.300" }}
        _focus={{ outline: "2px solid #f97316", outlineOffset: "2px", borderRadius: "2px" }}
      >
        {children}
      </Box>

      {isOpen && (
        <Box
          position="absolute"
          bottom="calc(100% + 6px)"
          left="50%"
          transform="translateX(-50%)"
          bg="gray.950"
          borderWidth="1px"
          borderColor="gray.700"
          borderRadius="md"
          p={3}
          boxShadow="xl"
          zIndex={100}
          width="max-content"
          maxW="300px"
          pointerEvents="none"
          role="tooltip"
          id={`tooltip-${termId}`}
        >
          <Text fontSize="xs" fontWeight="bold" color="orange.400" mb={1}>
            {entry.term}
          </Text>
          <Text fontSize="xs" color="gray.300" lineHeight="1.5">
            {entry.plainDefinition}
          </Text>
          <Text fontSize="2xs" color="gray.500" mt={1}>
            Click to view full entry in Glossary
          </Text>
        </Box>
      )}
    </Box>
  );
}
