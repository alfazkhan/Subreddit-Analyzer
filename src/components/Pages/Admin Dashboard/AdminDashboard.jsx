import Header from "../../ui/Header";
import IgnoredWordsSection from "./IgnoredWordsSection";
import ReanalyzeSection from "./ReanalyzeSection";
import { Flex, Tabs } from "@chakra-ui/react";

export default function AdminDashboard() {
  return (
    <Flex direction="column" justifyContent="center" width="80%" margin="auto">
      <Header text="Admin Dashboard" highlight="Dashboard" />
      <Tabs.Root
        variant="subtle"
        defaultValue="ignored_words"
        orientation="vertical"
        css={{
          "--tabs-indicator-bg": "colors.gray.subtle",
          "--tabs-indicator-shadow": "shadows.xs",
          "--tabs-trigger-radius": "radii.full",
          
        }}
      >
        <Tabs.List >
          <Tabs.Trigger value="tasks">Subreddits</Tabs.Trigger>
          <Tabs.Trigger value="ignored_words">Ignored Words</Tabs.Trigger>
          <Tabs.Trigger value="reanalyze">Reanalyze Data</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="tasks">
          Manage your tasks and their progress here.
        </Tabs.Content>
        <Tabs.Content value="ignored_words">
          <IgnoredWordsSection/>
        </Tabs.Content>

        <Tabs.Content value="reanalyze">
          <ReanalyzeSection />;
        </Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}
