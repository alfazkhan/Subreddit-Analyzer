import { useEffect, useRef, useState } from "react";
import { Box, Button, Text } from "@chakra-ui/react";
import { PLATFORM_TABS } from "@/data/aboutContent";
import { C, P, Section } from "./aboutUi";
import { LuMaximize2, LuX } from "react-icons/lu";

export function PlatformSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const active = PLATFORM_TABS[activeIndex];

  useEffect(() => {
    if (!lightboxOpen) return;
    const trigger = triggerRef.current;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [lightboxOpen]);

  // Arrow-key navigation between tabs (WAI-ARIA tabs pattern)
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % PLATFORM_TABS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + PLATFORM_TABS.length) % PLATFORM_TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = PLATFORM_TABS.length - 1;
    else return;
    e.preventDefault();
    setActiveIndex(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Section
      id="section-platform"
      title="The dashboard"
      lede={`The dashboard has ${PLATFORM_TABS.length} tabs, each looking at the same posts from a different angle.`}
    >
      <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "180px 1fr" }} gap={{ base: 4, md: 6 }}>
        {/* Tab list */}
        <Box
          role="tablist"
          aria-label="Dashboard tabs"
          aria-orientation="vertical"
          display="flex"
          flexDirection={{ base: "row", md: "column" }}
          overflowX={{ base: "auto", md: "visible" }}
          gap={1}
          pb={{ base: 1, md: 0 }}
        >
          {PLATFORM_TABS.map((tab, index) => {
            const selected = index === activeIndex;
            return (
              <Box
                as="button"
                key={tab.tabValue}
                ref={(el: HTMLButtonElement | null) => {
                  tabRefs.current[index] = el;
                }}
                role="tab"
                id={`platform-tab-${index}`}
                aria-selected={selected}
                aria-controls="platform-tabpanel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(e: React.KeyboardEvent) => onTabKeyDown(e, index)}
                textAlign="left"
                whiteSpace="nowrap"
                fontSize="sm"
                px={3}
                py={2}
                borderRadius="md"
                bg={selected ? "whiteAlpha.100" : "transparent"}
                color={selected ? C.heading : "gray.400"}
                fontWeight={selected ? "medium" : "normal"}
                cursor="pointer"
                _hover={{ color: "gray.100", bg: "whiteAlpha.50" }}
                _focusVisible={{ outline: "2px solid", outlineColor: "orange.400", outlineOffset: "1px" }}
              >
                {tab.tabLabel}
              </Box>
            );
          })}
        </Box>

        {/* Panel */}
        <Box role="tabpanel" id="platform-tabpanel" aria-labelledby={`platform-tab-${activeIndex}`} minW={0}>
          {active.imageSrc ? (
            <Box
              as="button"
              ref={triggerRef}
              onClick={() => setLightboxOpen(true)}
              aria-label={`Enlarge screenshot: ${active.tabLabel}`}
              position="relative"
              display="block"
              width="full"
              p={0}
              borderWidth="1px"
              borderColor={C.line}
              borderRadius="lg"
              overflow="hidden"
              bg="black"
              cursor="zoom-in"
              css={{ "&:hover .enlarge-hint": { opacity: 1 } }}
              _focusVisible={{ outline: "2px solid", outlineColor: "orange.400", outlineOffset: "2px" }}
            >
              <Box
                as="img"
                src={active.imageSrc}
                alt={active.altText}
                loading="lazy"
                display="block"
                width="100%"
                height="auto"
                aspectRatio="16 / 10"
                objectFit="cover"
                objectPosition="top"
              />
              <Box
                className="enlarge-hint"
                position="absolute"
                bottom={3}
                right={3}
                display="flex"
                alignItems="center"
                gap={1.5}
                px={2.5}
                py={1}
                borderRadius="md"
                bg="blackAlpha.800"
                color="gray.200"
                fontSize="xs"
                opacity={0.85}
                transition="opacity 150ms ease"
              >
                <LuMaximize2 size={12} /> Enlarge
              </Box>
            </Box>
          ) : (
            <Box
              aspectRatio="16 / 10"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor={C.line}
              borderRadius="lg"
              color={C.muted}
              fontSize="sm"
            >
              No screenshot yet
            </Box>
          )}
          <P mt={3} fontSize="sm" color="gray.400">
            <Text as="span" color={C.heading} fontWeight="medium">
              {active.tabLabel}.
            </Text>{" "}
            {active.caption}
          </P>
        </Box>
      </Box>

      {/* Lightbox */}
      {lightboxOpen && active.imageSrc && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.900"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 3, md: 8 }}
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged screenshot: ${active.tabLabel}`}
        >
          <Box position="relative" maxW="1400px" width="full" onClick={(e) => e.stopPropagation()}>
            <Button
              ref={closeButtonRef}
              position="absolute"
              top={-11}
              right={0}
              size="sm"
              variant="ghost"
              color="gray.300"
              _hover={{ color: "white", bg: "whiteAlpha.200" }}
              onClick={() => setLightboxOpen(false)}
              aria-label="Close image preview"
            >
              <LuX size={20} />
            </Button>
            <Box
              as="img"
              src={active.imageSrc}
              alt={active.altText}
              display="block"
              mx="auto"
              maxH="85vh"
              maxW="100%"
              borderRadius="md"
            />
            <Text fontSize="sm" color="gray.300" mt={3} textAlign="center">
              {active.caption}
            </Text>
          </Box>
        </Box>
      )}
    </Section>
  );
}
