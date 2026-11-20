import { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { C } from "./aboutUi";

export interface TocItem {
  id: string;
  label: string;
}

export const TOC_ITEMS: TocItem[] = [
  { id: "section-question", label: "The question" },
  { id: "section-hypotheses", label: "Findings" },
  { id: "section-reading-results", label: "Reading the numbers" },
  { id: "section-platform", label: "The dashboard" },
  { id: "section-architecture", label: "How it works" },
  { id: "section-data-method", label: "Data" },
  { id: "section-limitations-ethics", label: "Limits and ethics" },
  { id: "section-about-me", label: "About me" },
  { id: "section-glossary", label: "Glossary" },
  { id: "section-tech-stack", label: "Tech stack" },
];

const ACTIVE_OFFSET = 140;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

export function PageToc() {
  const [activeId, setActiveId] = useState<string>(TOC_ITEMS[0].id);

  useEffect(() => {
    const handleScroll = () => {
      // getBoundingClientRect is relative to the viewport, so it is not
      // affected by positioned ancestors the way offsetTop is.
      let current = TOC_ITEMS[0].id;
      for (const item of TOC_ITEMS) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) {
          current = item.id;
        }
      }
      setActiveId(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Mobile: compact dropdown */}
      <Box display={{ base: "block", lg: "none" }}>
        <Text as="label" htmlFor="about-toc-select" fontSize="sm" color={C.muted} display="block" mb={1.5}>
          Jump to
        </Text>
        <Box
          as="select"
          id="about-toc-select"
          value={activeId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => scrollToId(e.target.value)}
          width="full"
          bg="gray.900"
          borderWidth="1px"
          borderColor={C.line}
          borderRadius="md"
          py={2.5}
          px={3}
          color="gray.200"
          fontSize="sm"
          _focusVisible={{ outline: "2px solid", outlineColor: "orange.400" }}
        >
          {TOC_ITEMS.map((item) => (
            <option key={item.id} value={item.id} style={{ background: "#18181b", color: "#e4e4e7" }}>
              {item.label}
            </option>
          ))}
        </Box>
      </Box>

      {/* Desktop: sticky sidebar */}
      <Box
        as="nav"
        aria-label="Table of contents"
        display={{ base: "none", lg: "block" }}
        position="sticky"
        top="96px"
      >
        <Text fontSize="sm" fontWeight="semibold" color={C.heading} mb={3}>
          On this page
        </Text>
        <Box as="ul" listStyleType="none" m={0} p={0} borderLeftWidth="1px" borderColor={C.line}>
          {TOC_ITEMS.map((item) => {
            const isActive = activeId === item.id;
            return (
              <Box as="li" key={item.id}>
                <Box
                  as="a"
                  href={`#${item.id}`}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    scrollToId(item.id);
                  }}
                  aria-current={isActive ? "location" : undefined}
                  display="block"
                  py={1.5}
                  pl={4}
                  ml="-1px"
                  fontSize="sm"
                  lineHeight="1.4"
                  textDecoration="none"
                  borderLeftWidth="2px"
                  borderLeftColor={isActive ? "orange.400" : "transparent"}
                  color={isActive ? C.heading : C.muted}
                  fontWeight={isActive ? "medium" : "normal"}
                  transition="color 150ms ease, border-color 150ms ease"
                  _hover={{ color: "gray.200" }}
                  _focusVisible={{ outline: "2px solid", outlineColor: "orange.400", outlineOffset: "2px" }}
                >
                  {item.label}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </>
  );
}
