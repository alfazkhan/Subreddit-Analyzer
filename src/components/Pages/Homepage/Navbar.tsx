import { Header, ServerStatus } from "../../ui-components/Layout";
import { Flex, Button, HStack } from "@chakra-ui/react";
import { NavLink, Outlet } from "react-router-dom";
import LogoutButton from "../Admin Dashboard/LogoutButton";

const NAV_LINKS = [
  { to: "/about", label: "About Project" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

export default function Navbar() {
  return (
    <>
      <Flex  justify="space-between" align="flex-end" p={5}>
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
      <Outlet />
    </>
  );
}
