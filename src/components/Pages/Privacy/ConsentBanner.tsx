import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useAnalyticsConsent } from "@/util/analyticsConsent";

export default function ConsentBanner() {
  const { consent, isOpen, accept, reject, close } = useAnalyticsConsent();

  if (!isOpen) {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      zIndex="1000"
      bg="gray.950"
      borderTop="1px solid"
      borderColor="gray.800"
      p={{ base: 4, md: 5 }}
      boxShadow="0 -4px 20px rgba(0, 0, 0, 0.6)"
    >
      <Flex
        maxW="1200px"
        margin="auto"
        direction={{ base: "column", lg: "row" }}
        align={{ base: "stretch", lg: "center" }}
        justify="space-between"
        gap={4}
      >
        <Stack gap={1} flex="1">
          <HStack gap={3} align="center">
            <Text fontWeight="bold" fontSize="md" color="gray.100">
              Privacy & Analytics Preferences
            </Text>
            {consent && (
              <Badge
                variant="subtle"
                colorPalette={consent === "accepted" ? "green" : "gray"}
                size="sm"
              >
                Current: {consent.toUpperCase()}
              </Badge>
            )}
          </HStack>
          <Text fontSize="sm" color="gray.300" lineHeight="tall">
            This academic research platform uses optional Google Firebase
            Analytics (GA4) to observe aggregate page traffic and technical usage.
            In compliance with GDPR and German TDDDG (§ 25), analytics tracking is
            disabled by default. No analytics cookies or client identifiers are
            stored unless you grant explicit consent. You can modify or withdraw
            your consent at any time. Read our{" "}
            <RouterLink
              to="/privacy"
              style={{
                color: "#f97316",
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              Privacy Policy
            </RouterLink>{" "}
            for complete details.
          </Text>
        </Stack>

        <HStack
          gap={3}
          justify={{ base: "flex-end", lg: "center" }}
          flexShrink={0}
        >
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.600"
            color="white"
            _hover={{ bg: "gray.800", borderColor: "gray.400" }}
            fontWeight="semibold"
            px={4}
            py={2}
            onClick={reject}
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.600"
            color="white"
            _hover={{ bg: "gray.800", borderColor: "gray.400" }}
            fontWeight="semibold"
            px={4}
            py={2}
            onClick={accept}
          >
            Accept Analytics
          </Button>
          {consent !== null && (
            <Button
              size="sm"
              variant="ghost"
              color="gray.400"
              _hover={{ color: "white", bg: "gray.800" }}
              onClick={close}
            >
              Close
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}
