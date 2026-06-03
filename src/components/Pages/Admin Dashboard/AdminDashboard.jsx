import { Link } from "react-router-dom";
import Header from "../../ui-components/Header";
import IgnoredWordsSection from "./IgnoredWordsSection";
import ReanalyzeSection from "./ReanalyzeSection";
import { Flex, Tabs } from "@chakra-ui/react";
import SubredditsSection from "./SubredditsSection";
import LogoutButton from "./LogoutButton";
import UsersSection from "./UsersSection";

export default function AdminDashboard() {
  return (
    <Flex direction="column" justifyContent="center" width="80%" margin="auto">
      <Flex gap="4" alignItems="center" justify="space-between" margin="5">
        <Link to="/">
          <Header text="Admin Dashboard" highlight="Dashboard" />
        </Link>
        <LogoutButton />
      </Flex>
      <Tabs.Root
        variant="subtle"
        defaultValue="manage-users"
        orientation="vertical"
        css={{
          "--tabs-indicator-bg": "colors.gray.subtle",
          "--tabs-indicator-shadow": "shadows.xs",
          "--tabs-trigger-radius": "radii.full",
        }}
      >
        <Tabs.List>
          <Tabs.Trigger value="subreddits">Subreddits</Tabs.Trigger>
          <Tabs.Trigger value="ignored_words">Ignored Words</Tabs.Trigger>
          <Tabs.Trigger value="reanalyze">Reanalyze Data</Tabs.Trigger>
          <Tabs.Trigger value="manage-users">Manage Users</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="subreddits">
          <SubredditsSection />
        </Tabs.Content>
        <Tabs.Content value="ignored_words">
          <IgnoredWordsSection />
        </Tabs.Content>

        <Tabs.Content value="reanalyze">
          <ReanalyzeSection />;
        </Tabs.Content>
        <Tabs.Content value="manage-users">
          <UsersSection />;
        </Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}
