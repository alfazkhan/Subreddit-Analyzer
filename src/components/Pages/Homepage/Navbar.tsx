import { Header, ServerStatus } from "../../ui-components/Layout";
import { Box, Button, Flex, HStack } from "@chakra-ui/react";
import { NavLink, Outlet } from "react-router-dom";
import LogoutButton from "../Admin Dashboard/LogoutButton";
import Footer from "../../ui-components/Footer";

const NAV_LINKS = [
  { to: "/about", label: "About Project" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

export default function Navbar() {
  return (
    <Flex direction="column" minH="100vh">
      <Flex justify="space-between" align="flex-end" p={5}>
        <NavLink to="/">
          <Header text={"Subreddit Analyzer"} highlight="Analyzer" />
        </NavLink>
        <HStack>
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to}>
              <Button
                size="sm"
                variant="ghost"
                color="orange.500"
                colorPalette="orange"
                fontWeight="black"
              >
                {link.label}
              </Button>
            </NavLink>
          ))}
          <ServerStatus />
          <LogoutButton />
        </HStack>
      </Flex>
      <Box flex="1">
        <Outlet />
      </Box>
      <Footer />
    </Flex>
  );
}
