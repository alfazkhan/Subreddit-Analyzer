import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { openConsentBanner } from "@/util/analyticsConsent";
import ConsentBanner from "@/components/Pages/Privacy/ConsentBanner";

export default function Footer() {
  return (
    <>
      <Box
        as="footer"
        mt="auto"
        borderTop="1px solid"
        borderColor="gray.800"
        bg="gray.950"
        py={6}
        px={6}
        width="full"
      >
        <Flex
          maxW="1200px"
          margin="auto"
          direction={{ base: "column", sm: "row" }}
          align="center"
          justify="space-between"
          gap={4}
        >
          <Text fontSize="sm" color="gray.400">
            Subreddit Analyzer &mdash; Non-Commercial Academic Research Platform
          </Text>
          <HStack gap={5} flexWrap="wrap" justify="center">
            <RouterLink
              to="/about"
              style={{
                color: "#9ca3af",
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              About Project
            </RouterLink>
            <RouterLink
              to="/privacy"
              style={{
                color: "#9ca3af",
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Privacy Policy
            </RouterLink>
            <Button
              variant="ghost"
              size="xs"
              color="gray.400"
              _hover={{ color: "orange.400", bg: "transparent" }}
              p={0}
              height="auto"
              fontWeight="normal"
              onClick={openConsentBanner}
            >
              Cookie Settings
            </Button>
            <RouterLink
              to="/login"
              style={{
                color: "#9ca3af",
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Admin Login
            </RouterLink>
          </HStack>
        </Flex>
      </Box>
      <ConsentBanner />
    </>
  );
}
