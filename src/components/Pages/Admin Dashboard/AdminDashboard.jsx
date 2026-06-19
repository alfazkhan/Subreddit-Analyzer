import { Link } from "react-router-dom";
import Header from "../../ui-components/Header";
import IgnoredWordsSection from "./Ignored-Words/IgnoredWordsSection";
import ReanalyzeSection from "./ReanalyzeSection";
import { Flex, Tabs } from "@chakra-ui/react";
import SubredditsSection from "./SubredditsSection";
import LogoutButton from "./LogoutButton";
import UsersSection from "./Users/UsersSection";
import { useSelector } from "react-redux";

const tabsConfig = {
  Subreddits: ["Super Admin", "Admin", "Guest", "Developer"],
  "Ignored Words": ["Super Admin", "Admin", "Guest", "Developer"],
  Reanalyze: ["Super Admin", "Guest", "Developer"],
  "Manage Users": ["Super Admin"],
};

export default function AdminDashboard() {
  const authState = useSelector((state) => state.authState);

  return (
    <Flex direction="column" justifyContent="center" width="80%" margin="auto">
      <Flex gap="4" alignItems="center" justify="space-between" margin="5">
        <Link to="/">
          <Header text="Admin Dashboard" highlight="Dashboard" />
        </Link>
        <LogoutButton />
      </Flex>
      <Tabs.Root
        variant="plain"
        defaultValue="manage users"
        orientation="horizontal"
        fitted
        lazyMount
        // unmountOnExit    
        css={{
          "--tabs-indicator-bg": "colors.orange.600",
          "--tabs-indicator-color": "colors.orange.600",
        }}
        _open={{
          animation: "fade-in 800ms ease-out",
        }}
      >
        <Tabs.List>
          {Object.keys(tabsConfig).map((tab)=>{
            if(tabsConfig[tab].findIndex(e=> e===authState.role) !== -1){
              return <Tabs.Trigger key={tab} fontWeight="bolder" color="gray.100" value={tab.toLowerCase()}>{tab}</Tabs.Trigger>
            }
          })}
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>

        <Tabs.Content value="subreddits">
          <SubredditsSection />
        </Tabs.Content>
        <Tabs.Content value="ignored words">
          <IgnoredWordsSection />
        </Tabs.Content>
        <Tabs.Content value="reanalyze">
          <ReanalyzeSection />
        </Tabs.Content>
        <Tabs.Content value="manage users">
          <UsersSection />
        </Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}
