import { useState, useMemo } from "react";
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { GLOSSARY_ITEMS } from "@/data/aboutContent";
import { LuSearch, LuBookOpen } from "react-icons/lu";

export function TerminologySection() {
  const [searchQuery, setSearchQuery] = useState("");

  const sortedItems = useMemo(() => {
    return [...GLOSSARY_ITEMS].sort((a, b) => a.term.localeCompare(b.term));
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return sortedItems;
    const q = searchQuery.toLowerCase();
    return sortedItems.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.plainDefinition.toLowerCase().includes(q) ||
        item.whereUsed.toLowerCase().includes(q),
    );
  }, [searchQuery, sortedItems]);

  return (
    <Box id="section-glossary">
      <VStack align="stretch" gap={6}>
        <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} wrap="wrap" gap={3} pb={2} borderBottom="1px solid" borderColor="gray.800">
          <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold">
            Glossary of Terms ({GLOSSARY_ITEMS.length} entries)
          </Heading>

          {/* Search Bar */}
          <Box position="relative" width={{ base: "full", sm: "280px" }}>
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.500" pointerEvents="none">
              <LuSearch size={14} />
            </Box>
            <Box
              as="input"
              type="text"
              placeholder="Search terms, formulas..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              pl={8}
              pr={3}
              py={1.5}
              bg="gray.950"
              borderWidth="1px"
              borderColor="gray.800"
              borderRadius="md"
              color="gray.200"
              fontSize="xs"
              width="full"
              _focus={{ outline: "2px solid #f97316" }}
            />
          </Box>
        </Flex>

        <Text color="gray.300" fontSize="md" lineHeight="1.8">
          Alphabetical reference of every computational, econometric, linguistic, and platform concept operationalized in the research instrument.
        </Text>

        {filteredItems.length === 0 ? (
          <Box bg="gray.950" p={6} borderRadius="lg" textAlign="center" color="gray.400">
            <Text fontSize="sm">No glossary entries match &quot;{searchQuery}&quot;.</Text>
          </Box>
        ) : (
          <VStack align="stretch" gap={4}>
            {filteredItems.map((item) => (
              <Box
                key={item.id}
                id={`glossary-${item.id}`}
                tabIndex={-1}
                bg="gray.950"
                borderWidth="1px"
                borderColor="gray.800"
                borderRadius="lg"
                p={4}
                _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #f97316" }}
                transition="border-color 150ms ease"
              >
                <VStack align="stretch" gap={2}>
                  <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} wrap="wrap" gap={2}>
                    <Text fontSize="sm" fontWeight="bold" color="gray.100">
                      {item.term}
                    </Text>
                    <Badge variant="subtle" colorPalette="gray" size="2xs">
                      {item.category}
                    </Badge>
                  </Flex>

                  {/* 1. Plain sentence definition */}
                  <Text fontSize="xs" color="gray.300" lineHeight="1.6">
                    {item.plainDefinition}
                  </Text>

                  {/* 2. Formula (if any) */}
                  {item.formula && (
                    <Box bg="blackAlpha.800" p={2} borderRadius="md" borderWidth="1px" borderColor="gray.850" my={1} overflowX="auto">
                      <Text fontSize="2xs" color="orange.300" fontFamily="mono">
                        <code>{item.formula}</code>
                      </Text>
                    </Box>
                  )}

                  {/* 3. Where it is used here */}
                  <Box bg="whiteAlpha.50" px={3} py={1.5} borderRadius="md">
                    <Text fontSize="2xs" color="gray.400" lineHeight="1.5">
                      <strong style={{ color: "#9ca3af" }}>Where it is used here:</strong> {item.whereUsed}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
