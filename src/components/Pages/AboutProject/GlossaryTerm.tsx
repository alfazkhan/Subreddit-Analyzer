import React, { useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { GLOSSARY_ITEMS } from "@/data/aboutContent";

export const GLOSSARY_OPEN_EVENT = "about:glossary-open";

/**
 * Scrolls to a glossary entry. The glossary list is collapsed by default, so
 * we first ask it to expand (TerminologySection listens for this event), then
 * scroll on the next frame once the entry is in the DOM.
 */
export function openGlossaryEntry(termId: string) {
  window.dispatchEvent(new CustomEvent(GLOSSARY_OPEN_EVENT, { detail: termId }));
  requestAnimationFrame(() => {
    const target = document.getElementById(`glossary-${termId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.focus({ preventScroll: true });
    }
  });
}

interface GlossaryTermProps {
  termId: string;
  children: React.ReactNode;
}

export function GlossaryTerm({ termId, children }: GlossaryTermProps) {
  const [isOpen, setIsOpen] = useState(false);
  const entry = GLOSSARY_ITEMS.find((item) => item.id === termId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openGlossaryEntry(termId);
  };

  if (!entry) {
    return <span>{children}</span>;
  }

  return (
    <Box
      as="span"
      position="relative"
      display="inline"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <Box
        as="a"
        href={`#glossary-${termId}`}
        onClick={handleClick}
        borderBottom="1px dashed"
        borderColor="orange.400"
        color="inherit"
        textDecoration="none"
        cursor="help"
        tabIndex={0}
        
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
          bg="gray.900"
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
          <Text fontSize="xs" color="gray.500" mt={1.5}>
            Click to open in the glossary
          </Text>
        </Box>
      )}
    </Box>
  );
}
