import Header from "@/components/ui-components/Header";
import ServerStatus from "@/components/ui-components/ServerStatus";
import { Flex, Button, HStack } from "@chakra-ui/react";
import { NavLink, Outlet } from "react-router-dom";
import LogoutButton from "../Admin Dashboard/LogoutButton";

export default function Navbar() {
  return (
    <>
      <Flex  justify="space-between" align="flex-end" p={5}>
        <NavLink to="/">
          <Header text={"Subreddit Analyzer"} highlight="Analyzer" />
        </NavLink>
        <HStack>
          <NavLink to="/about">
            <Button size="sm" variant="ghost" color="orange.500" colorPalette="orange" fontWeight="black">
              About Project
            </Button>
          </NavLink>
          <NavLink to="/dashboard">
            <Button size="sm" variant="ghost" color="orange.500" colorPalette="orange" fontWeight="black">
              Dashboard
            </Button>
          </NavLink>
          <ServerStatus />
          <LogoutButton />
        </HStack>
      </Flex>
      <Outlet />
    </>
  );
}
