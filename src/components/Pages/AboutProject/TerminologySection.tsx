import { useEffect, useMemo, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { GLOSSARY_ITEMS } from "@/data/aboutContent";
import { C, Section } from "./aboutUi";
import { GLOSSARY_OPEN_EVENT } from "./GlossaryTerm";
import { LuChevronDown, LuSearch } from "react-icons/lu";

const SORTED_ITEMS = [...GLOSSARY_ITEMS].sort((a, b) => a.term.localeCompare(b.term));
const COLLAPSED_COUNT = 8;

export function TerminologySection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Inline glossary links ask the list to expand before scrolling to an entry
  useEffect(() => {
    const expand = () => setExpanded(true);
    window.addEventListener(GLOSSARY_OPEN_EVENT, expand);
    return () => window.removeEventListener(GLOSSARY_OPEN_EVENT, expand);
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return expanded ? SORTED_ITEMS : SORTED_ITEMS.slice(0, COLLAPSED_COUNT);
    return SORTED_ITEMS.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.plainDefinition.toLowerCase().includes(q) ||
        item.whereUsed.toLowerCase().includes(q) ||
        (item.formula ?? "").toLowerCase().includes(q),
    );
  }, [searchQuery, expanded]);

  const search = (
    <Box position="relative" width={{ base: "full", sm: "260px" }}>
      <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color={C.muted} pointerEvents="none">
        <LuSearch size={15} />
      </Box>
      <Box
        as="input"
        type="search"
        aria-label="Search glossary"
        placeholder="Search terms, formulas..."
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        width="full"
        pl={9}
        pr={3}
        py={2}
        bg="gray.900"
        borderWidth="1px"
        borderColor={C.line}
        borderRadius="md"
        color="gray.100"
        fontSize="sm"
        _placeholder={{ color: "gray.500" }}
        _focusVisible={{ outline: "2px solid", outlineColor: "orange.400", outlineOffset: "1px" }}
      />
    </Box>
  );

  return (
    <Section
      id="section-glossary"
      title="Glossary"
      aside={search}
      lede={`Plain definitions for the ${GLOSSARY_ITEMS.length} technical terms used on this page. Underlined terms above link here.`}
    >
      {filteredItems.length === 0 ? (
        <Text color={C.muted} py={6}>
          No terms match &ldquo;{searchQuery}&rdquo;.
        </Text>
      ) : (
        <Box as="dl" m={0} borderTopWidth="1px" borderColor="whiteAlpha.100">
          {filteredItems.map((item) => (
            <Box
              key={item.id}
              id={`glossary-${item.id}`}
              tabIndex={-1}
              scrollMarginTop="96px"
              py={4}
              borderBottomWidth="1px"
              borderColor="whiteAlpha.100"
              outline="none"
              transition="background-color 300ms ease"
              _focus={{ bg: "whiteAlpha.50" }}
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "220px 1fr" }}
              columnGap={6}
              rowGap={1}
            >
              <Box as="dt">
                <Text fontWeight="semibold" color={C.heading} lineHeight="1.5">
                  {item.term}
                </Text>
                <Text fontSize="xs" color={C.muted}>
                  {item.category}
                </Text>
              </Box>
              <Box as="dd" m={0}>
                <Text color={C.text} lineHeight="1.65">
                  {item.plainDefinition}
                </Text>
                {item.formula && (
                  <Box
                    as="code"
                    display="inline-block"
                    mt={2}
                    px={2}
                    py={0.5}
                    fontSize="xs"
                    color="orange.200"
                    bg="blackAlpha.500"
                    borderRadius="sm"
                  >
                    {item.formula}
                  </Box>
                )}
                <Text fontSize="sm" color={C.muted} mt={1.5} lineHeight="1.5">
                  Used in: {item.whereUsed}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {!isSearching && !expanded && (
        <Box
          as="button"
          onClick={() => setExpanded(true)}
          mt={5}
          display="inline-flex"
          alignItems="center"
          gap={1.5}
          fontSize="sm"
          fontWeight="medium"
          color="orange.300"
          cursor="pointer"
          _hover={{ color: "orange.200" }}
          _focusVisible={{ outline: "2px solid", outlineColor: "orange.400", outlineOffset: "2px" }}
        >
          Show all {SORTED_ITEMS.length} terms <LuChevronDown />
        </Box>
      )}
    </Section>
  );
}
