import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { PLATFORM_TABS } from "@/data/aboutContent";
import type { PlatformTabScreenshot } from "@/util/Types";
import { LuMaximize2, LuX } from "react-icons/lu";

export function PlatformSection() {
  const [activeScreenshot, setActiveScreenshot] = useState<PlatformTabScreenshot | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Close lightbox on Escape key and trap basic keyboard focus
  useEffect(() => {
    if (!activeScreenshot) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveScreenshot(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Focus close button on open
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [activeScreenshot]);

  const openLightbox = (tab: PlatformTabScreenshot, e: React.MouseEvent) => {
    triggerRef.current = e.currentTarget as HTMLElement;
    setActiveScreenshot(tab);
  };

  return (
    <Box id="section-platform">
      <VStack align="stretch" gap={5}>
        <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800">
          What the Platform Does
        </Heading>

        <Text color="gray.300" fontSize="md" lineHeight="1.8">
          The dashboard provides eight analytical views exploring civic submissions from multiple angles,
          ranging from longitudinal moving averages and diurnal time-of-day curves to granular keyword tables and individual post records.
        </Text>

        {/* Tab Cards Grid */}
        <Flex wrap="wrap" gap={6} width="full" pt={2}>
          {PLATFORM_TABS.map((tab) => (
            <Box
              key={tab.tabValue}
              flex="1 1 calc(50% - 12px)"
              minW={{ base: "100%", md: "320px" }}
              bg="gray.950"
              borderWidth="1px"
              borderColor="gray.800"
              borderRadius="lg"
              overflow="hidden"
              display="flex"
              flexDirection="column"
              _hover={{ borderColor: "orange.500" }}
              transition="border-color 180ms ease"
            >
              {/* Image Preview Container */}
              <Box
                position="relative"
                bg="blackAlpha.800"
                overflow="hidden"
                cursor="pointer"
                onClick={(e) => openLightbox(tab, e)}
                tabIndex={0}
                role="button"
                aria-label={`Enlarge screenshot for ${tab.tabLabel}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLightbox(tab, e as unknown as React.MouseEvent);
                  }
                }}
                _focus={{ outline: "2px solid #f97316", outlineOffset: "-2px" }}
              >
                <Box
                  as="img"
                  src={tab.imageSrc}
                  alt={tab.altText}
                  loading="lazy"
                  width="100%"
                  height="200px"
                  style={{ objectFit: "cover" }}
                />
                <Box
                  position="absolute"
                  bottom={2}
                  right={2}
                  bg="blackAlpha.800"
                  px={2}
                  py={1}
                  borderRadius="md"
                  color="gray.300"
                  fontSize="2xs"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <LuMaximize2 size={12} color="#f97316" />
                  <Text>Click to enlarge</Text>
                </Box>
              </Box>

              {/* Caption Content */}
              <Box p={4} flex="1" display="flex" flexDirection="column" gap={2}>
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="bold" color="gray.100">
                    {tab.tabLabel}
                  </Text>
                  <Badge variant="outline" colorPalette="gray" size="xs">
                    {tab.tabValue}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.400" lineHeight="1.6">
                  {tab.caption}
                </Text>
              </Box>
            </Box>
          ))}
        </Flex>

        {/* Accessible Lightbox Modal */}
        {activeScreenshot && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.900"
            zIndex={1000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={{ base: 4, md: 8 }}
            onClick={() => setActiveScreenshot(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Enlarged view: ${activeScreenshot.tabLabel}`}
          >
            <Box
              bg="gray.900"
              borderWidth="1px"
              borderColor="gray.700"
              borderRadius="xl"
              maxW="1100px"
              width="full"
              maxH="90vh"
              display="flex"
              flexDirection="column"
              overflow="hidden"
              boxShadow="2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <Flex justify="space-between" align="center" p={4} borderBottom="1px solid" borderColor="gray.800">
                <Text fontSize="sm" fontWeight="bold" color="gray.100">
                  {activeScreenshot.tabLabel}
                </Text>
                <Button
                  ref={closeButtonRef}
                  size="xs"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: "white", bg: "whiteAlpha.100" }}
                  onClick={() => setActiveScreenshot(null)}
                  aria-label="Close image preview"
                >
                  <LuX size={18} />
                </Button>
              </Flex>

              {/* Modal Image Body */}
              <Box p={2} bg="blackAlpha.800" display="flex" justifyContent="center" alignItems="center" overflowY="auto">
                <Box
                  as="img"
                  src={activeScreenshot.imageSrc}
                  alt={activeScreenshot.altText}
                  maxH="70vh"
                  width="auto"
                  style={{ objectFit: "contain" }}
                />
              </Box>

              {/* Modal Caption Footer */}
              <Box p={4} bg="gray.950" borderTop="1px solid" borderColor="gray.800">
                <Text fontSize="xs" color="gray.300" lineHeight="1.6">
                  {activeScreenshot.caption}
                </Text>
              </Box>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
