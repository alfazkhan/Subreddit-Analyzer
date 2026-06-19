import keywordCount from "../../../../util/keywordCount.js";
import getTopKeywords from "../../../../util/getTopKeywords.js";
import paginationDataSlicer from "@/util/paginationDataSlicer.js";
import DataTable from "@/components/ui-components/DataTable";
import DataPagination from "@/components/ui-components/DataPagination";

import {
  HStack,
  Table,
  Field,
  NumberInput,
  Flex,
  Button,
  Input,
  Box,
  Text,
  IconButton,
} from "@chakra-ui/react";
import { useMemo, useState, useEffect } from "react";
import { LuDownload, LuCopy, LuArrowDownAZ, LuArrowUpZA, LuArrowDown01, LuArrowUp10 } from "react-icons/lu";

export default function KeywordTable({ data }) {
  // --- 1. Core Filter States ---
  const [minValue, setMinValue] = useState(20);
  const [maxValue, setMaxValue] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [stopWordsStr, setStopWordsStr] = useState("");
  const [customTop, setCustomTop] = useState(25); 
  
  // --- 2. Interaction States ---
  const [sortConfig, setSortConfig] = useState({ key: "value", direction: "desc" });
  const [activePreset, setActivePreset] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keywordsCount = keywordCount(data);

  // --- 3. Master Data Pipeline ---
  const processedData = useMemo(() => {
    const stopWords = stopWordsStr
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
      
    const searchLower = searchTerm.trim().toLowerCase();

    const entries = [];
    for (const [keyword, count] of Object.entries(keywordsCount)) {
      // Apply Numerical Filters
      if (count < minValue || count > maxValue) continue;
      
      // Apply Text Filters
      if (searchLower && !keyword.toLowerCase().includes(searchLower)) continue;
      if (stopWords.includes(keyword.toLowerCase())) continue;

      entries.push({ id: keyword, name: keyword, value: count });
    }

    // Apply Sorting
    entries.sort((a, b) => {
      if (sortConfig.key === "value") {
        return sortConfig.direction === "desc" ? b.value - a.value : a.value - b.value;
      } else {
        return sortConfig.direction === "desc" 
          ? b.name.localeCompare(a.name) 
          : a.name.localeCompare(b.name);
      }
    });

    return entries;
  }, [keywordsCount, minValue, maxValue, searchTerm, stopWordsStr, sortConfig]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [minValue, maxValue, searchTerm, stopWordsStr, sortConfig]);

  // --- 4. Pagination ---
  const totalItems = processedData.length;
  const paginatedSlice = useMemo(() => {
    return paginationDataSlicer(processedData, currentPage, pageSize);
  }, [processedData, currentPage, pageSize]);

  const currentMaxValue = processedData.length > 0 ? Math.max(...processedData.map((d) => d.value)) : 1;

  // --- 5. Action Handlers ---
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const handlePresetClick = (limit) => {
    setActivePreset(limit);
    getTopKeywords(keywordsCount, limit, setMinValue, setMaxValue);
  };

  const handleAllClick = () => {
    setActivePreset("all");
    const counts = Object.values(keywordsCount);
    const max = counts.length > 0 ? Math.max(...counts) : 100;
    setMinValue(1);
    setMaxValue(max);
  };

  const exportCSV = () => {
    const csvContent = [
      "Keyword,Count",
      ...processedData.map((item) => `"${item.name}",${item.value}`),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "keyword_analysis_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (error) {
        console.error("Fallback copy failed", error);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <Flex direction="column" gap={4} p={4} bg="blackAlpha.400" borderRadius="xl" borderWidth="1px" borderColor="whiteAlpha.200">
      
      {/* --- Filter Row 1: Text Analysis Filters --- */}
      <HStack gap={4} alignItems="flex-start">
        <Field.Root>
          <Field.Label fontSize="xs" color="whiteAlpha.700">Quick Search</Field.Label>
          <Input 
            placeholder="Search keyword..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            size="sm"
            color="white"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label fontSize="xs" color="whiteAlpha.700">Exclude Words (comma separated)</Field.Label>
          <Input 
            placeholder="e.g. http, www, post" 
            value={stopWordsStr} 
            onChange={(e) => setStopWordsStr(e.target.value)} 
            size="sm"
            color="white"
          />
        </Field.Root>
      </HStack>

      {/* --- Filter Row 2: Numerical Filters --- */}
      <HStack gap={4} alignItems="flex-end" wrap="wrap">
        <Field.Root required width="auto">
          <Field.Label fontSize="xs" color="whiteAlpha.700">Min Frequency</Field.Label>
          <NumberInput.Root
            value={minValue}
            allowMouseWheel
            onValueChange={(details) => {
              setMinValue(details.valueAsNumber);
              setActivePreset(null);
            }}
            size="sm"
            color="white"
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
        </Field.Root>
        
        <Field.Root required width="auto">
          <Field.Label fontSize="xs" color="whiteAlpha.700">Max Frequency</Field.Label>
          <NumberInput.Root
            value={maxValue}
            allowMouseWheel
            onValueChange={(details) => {
              setMaxValue(details.valueAsNumber);
              setActivePreset(null);
            }}
            size="sm"
            color="white"
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
        </Field.Root>
      </HStack>

      {/* --- Filter Row 3: Presets, Custom Top, Sorting, and Actions --- */}
      <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={4} mt={2}>
        <HStack wrap="wrap" gap={2}>
          <Button size="xs" colorPalette={activePreset === "all" ? "green" : "orange"} variant={activePreset === "all" ? "solid" : "outline"} onClick={handleAllClick}>
            All
          </Button>
          <Button size="xs" colorPalette={activePreset === 10 ? "green" : "orange"} variant={activePreset === 10 ? "solid" : "outline"} onClick={() => handlePresetClick(10)}>
            Top 10
          </Button>
          <Button size="xs" colorPalette={activePreset === 50 ? "green" : "orange"} variant={activePreset === 50 ? "solid" : "outline"} onClick={() => handlePresetClick(50)}>
            Top 50
          </Button>
          <Button size="xs" colorPalette={activePreset === 100 ? "green" : "orange"} variant={activePreset === 100 ? "solid" : "outline"} onClick={() => handlePresetClick(100)}>
            Top 100
          </Button>

          {/* Moved Custom Top X here */}
          <HStack gap={1} ml={{ base: 0, md: 2 }}>
            <NumberInput.Root
              value={customTop}
              allowMouseWheel
              onValueChange={(details) => setCustomTop(details.valueAsNumber)}
              size="xs"
              min={1}
              maxW="70px"
              color="white"
            >
              <NumberInput.Control />
              <NumberInput.Input />
            </NumberInput.Root>
            <Button size="xs" colorPalette={activePreset === customTop ? "green" : "orange"} variant={activePreset === customTop ? "solid" : "outline"} onClick={() => handlePresetClick(customTop)}>
              Top {customTop}
            </Button>
          </HStack>
        </HStack>

        <HStack wrap="wrap">
          <Button size="xs" variant="ghost" color="whiteAlpha.900" _hover={{ color: "orange.400", bg: "whiteAlpha.100" }} onClick={() => handleSort("name")}>
            Sort A-Z {sortConfig.key === "name" && (sortConfig.direction === "desc" ? <LuArrowUpZA /> : <LuArrowDownAZ />)}
          </Button>
          <Button size="xs" variant="ghost" color="whiteAlpha.900" _hover={{ color: "orange.400", bg: "whiteAlpha.100" }} onClick={() => handleSort("value")}>
            Sort Count {sortConfig.key === "value" && (sortConfig.direction === "desc" ? <LuArrowDown01 /> : <LuArrowUp10 />)}
          </Button>
          <Button size="xs" colorPalette="blue" variant="surface" onClick={exportCSV}>
            <LuDownload /> Export CSV
          </Button>
        </HStack>
      </Flex>

      {/* --- Data Table Integration --- */}
      <Table.ScrollArea h="500px" borderWidth="1px" rounded="md" borderColor="gray.700" mt={2}>
        <DataTable tableHeaders={["Keyword", "Count", "Actions"]}>
          {paginatedSlice.map((item) => (
            <Table.Row key={item.id} color="gray.900">
              
              <Table.Cell fontWeight="medium" color="whiteAlpha.900">
                {item.name}
              </Table.Cell>
              
              <Table.Cell>
                {/* Inline Data Bar Representation */}
                <Box position="relative" width="100%" height="28px" display="flex" alignItems="center" borderRadius="md" overflow="hidden" bg="whiteAlpha.50">
                  <Box 
                    position="absolute" 
                    left={0} 
                    top={0} 
                    height="100%" 
                    bg="orange.600" 
                    opacity={0.4} 
                    width={`${(item.value / currentMaxValue) * 100}%`} 
                    transition="width 0.3s ease-in-out"
                  />
                  <Text zIndex={1} position="relative" pl={3} fontWeight="bold" color="orange.400">
                    {item.value}
                  </Text>
                </Box>
              </Table.Cell>
              
              <Table.Cell textAlign="center">
                <IconButton 
                  size="xs" 
                  variant="ghost" 
                  color="gray.400" 
                  _hover={{ color: "orange.400" }}
                  aria-label="Copy keyword"
                  onClick={() => copyToClipboard(item.name)}
                >
                  <LuCopy />
                </IconButton>
              </Table.Cell>
              
            </Table.Row>
          ))}
          
          {paginatedSlice.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={3} textAlign="center" color="gray.500" py={10}>
                No keywords match the current filters.
              </Table.Cell>
            </Table.Row>
          )}
        </DataTable>
      </Table.ScrollArea>

      {/* --- Pagination Integration --- */}
      <DataPagination
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(newPage) => setCurrentPage(newPage)}
      />
    </Flex>
  );
}