import { Tabs, Box, Center, Heading, Spinner, Text } from "@chakra-ui/react";
import { LuFolder, LuSquareCheck, LuUser } from "react-icons/lu";
import KeywordTable from "../Data/KeywordTable";
import Sentiment from "../Data/Sentiment";
import KeywordsPieChart from "../Data/KeywordsPieChart";
import PostsTable from "../Data/PostsTable";
import PostsFrequency from "../Data/PostsFrequency";
import { useEffect } from "react";
import EmotionsThroughoutDay from "../Data/EmotionsThroughoutDay";

export default function DataTabs({ postsData, processingStatus }) {
  useEffect(() => {
    var currentdate = new Date();
    var datetime =
      "Last Sync: " +
      " @ " +
      currentdate.getHours() +
      ":" +
      currentdate.getMinutes() +
      ":" +
      currentdate.getSeconds() +
      ":" +
      currentdate.getMilliseconds();

    console.log("App.jsx rendered at:", datetime);
  }, []);

  const TabsListData = [
    {
      value: "Sentiments",
      icon: LuFolder,
      content: <Sentiment data={postsData} />,
    },
    {
      value: "Pie Chart",
      icon: LuSquareCheck,
      content: <KeywordsPieChart data={postsData} />,
    },
    {
      value: "Posts Table",
      icon: LuUser,
      content: <PostsTable data={postsData} />,
    },
    {
      value: "Keyword Table",
      icon: LuUser,
      content: <KeywordTable data={postsData} />,
    },
    {
      value: "Posts Frequency",
      icon: LuUser,
      content: <PostsFrequency data={postsData} />,
    },
    {
      value: "Sentiments Frequency",
      icon: LuUser,
      content: <EmotionsThroughoutDay data={postsData} />,
    },
  ];

  return (
    <Box position="relative" aria-busy="true" userSelect="none">
      <Tabs.Root
        defaultValue="Emotions Throughout Day"
        variant="plain"
        lazyMount
        unmountOnExit
        width="auto"
        fitted
        css={{
          "--tabs-indicator-bg": "colors.orange.600",
          "--tabs-indicator-color": "colors.orange.600",
        }}
        data-state={postsData.length !== 0 ? "open" : "closed"}
        _open={{
          animation: "fade-in 800ms ease-out",
        }}
      >
        <Tabs.List rounded="l3" p="1">
          {TabsListData.map((tab) => (
            <Tabs.Trigger
              key={tab.value} // Always add a key
              value={tab.value}
              color="white"
              fontWeight="bold"
              _selected={{ bgColor: "orange.600" }}
            >
              <tab.icon />
              {tab.value}
            </Tabs.Trigger>
          ))}
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>

        {TabsListData.map((tab) => (
          <Tabs.Content key={tab.value} value={tab.value}>
            {tab.content}
          </Tabs.Content>
        ))}
      </Tabs.Root>
      {(postsData.length === 0 || processingStatus) && (
        <Box pos="absolute" inset="0" bg="gray.700/80">
          <Center h="full">
            <Spinner
              borderWidth="4px"
              size="xl"
              color="orange.600"
              animationDuration="0.6s"
            />
          </Center>
        </Box>
      )}
    </Box>
  );
}
