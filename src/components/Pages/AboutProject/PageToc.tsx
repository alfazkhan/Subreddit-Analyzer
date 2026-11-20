import { useEffect, useState } from "react";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { LuList } from "react-icons/lu";

export interface TocItem {
  id: string;
  label: string;
  level: number;
}

export const TOC_ITEMS: TocItem[] = [
  { id: "section-intro", label: "Overview", level: 1 },
  { id: "section-question", label: "The Question", level: 1 },
  { id: "section-about-me", label: "About Me", level: 1 },
  { id: "section-thesis", label: "Why Master's Thesis", level: 1 },
  { id: "section-platform", label: "Platform Tabs", level: 1 },
  { id: "section-architecture", label: "System Architecture", level: 1 },
  { id: "section-data-method", label: "Data & Method", level: 1 },
  { id: "section-hypotheses", label: "Hypotheses (H1–H7)", level: 1 },
  { id: "section-reading-results", label: "Reading the Results", level: 1 },
  { id: "section-glossary", label: "Glossary", level: 1 },
  { id: "section-limitations-ethics", label: "Limitations & Ethics", level: 1 },
  { id: "section-tech-stack", label: "Tech Stack", level: 1 },
];

export function PageToc() {
  const [activeId, setActiveId] = useState<string>("section-intro");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

      for (let i = TOC_ITEMS.length - 1; i >= 0; i--) {
        const item = TOC_ITEMS[i];
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveId(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetId = e.target.value;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLinkClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const targetEl = document.getElementById(id);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <>
      {/* Mobile Compact Dropdown (visible on < lg screens) */}
      <Box display={{ base: "block", lg: "none" }} mb={6} width="full">
        <HStack gap={2} mb={2} color="gray.400">
          <LuList size={16} color="#f97316" />
          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
            Jump to Section
          </Text>
        </HStack>
        <Box as="select"
          value={activeId}
          onChange={handleSelectChange}
          width="full"
          bg="gray.950"
          borderWidth="1px"
          borderColor="gray.800"
          borderRadius="md"
          py={2}
          px={3}
          color="gray.200"
          fontSize="sm"
          _focus={{ outline: "2px solid #f97316" }}
        >
          {TOC_ITEMS.map((item) => (
            <option key={item.id} value={item.id} style={{ background: "#0a0a0a", color: "#e5e7eb" }}>
              {item.label}
            </option>
          ))}
        </Box>
      </Box>

      {/* Desktop Sticky Sidebar (visible on lg+ screens) */}
      <Box
        as="nav"
        aria-label="Table of contents"
        display={{ base: "none", lg: "block" }}
        position="sticky"
        top="80px"
        maxH="calc(100vh - 100px)"
        overflowY="auto"
        width="220px"
        flexShrink={0}
        pl={3}
      >
        <VStack align="stretch" gap={1}>
          <HStack gap={2} mb={3} color="gray.400">
            <LuList size={16} color="#f97316" />
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
              On This Page
            </Text>
          </HStack>

          {TOC_ITEMS.map((item) => {
            const isActive = activeId === item.id;
            return (
              <Box
                key={item.id}
                as="a"
                href={`#${item.id}`}
                onClick={(e: React.MouseEvent) => handleLinkClick(e, item.id)}
                py={1.5}
                px={2.5}
                fontSize="xs"
                lineHeight="1.5"
                borderRadius="md"
                textDecoration="none"
                color={isActive ? "orange.400" : "gray.400"}
                bg={isActive ? "whiteAlpha.50" : "transparent"}
                fontWeight={isActive ? "semibold" : "normal"}
                borderLeftWidth="2px"
                borderLeftColor={isActive ? "orange.500" : "transparent"}
                transition="all 180ms ease"
                _hover={{
                  color: "gray.100",
                  bg: "whiteAlpha.50",
                }}
                _focus={{
                  outline: "2px solid #f97316",
                  outlineOffset: "2px",
                }}
              >
                {item.label}
              </Box>
            );
          })}
        </VStack>
      </Box>
    </>
  );
}
