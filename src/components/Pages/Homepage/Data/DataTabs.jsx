import { Tabs, Box, Center, Spinner } from "@chakra-ui/react";
import {
  LuUser,
  LuCloud,
  LuSmile,
  LuDonut,
  LuTable,
  LuChartSpline,
} from "react-icons/lu";
import { RiBubbleChartLine } from "react-icons/ri";
import { VscSymbolKeyword } from "react-icons/vsc";
import KeywordTable from "../Data/KeywordTable";
import Sentiment from "../Data/Sentiment";
import KeywordsPieChart from "../Data/KeywordsPieChart";
import PostsTable from "../Data/PostsTable";
import PostsFrequency from "../Data/PostsFrequency";
import { useEffect } from "react";
import EmotionsThroughoutDay from "../Data/EmotionsThroughoutDay";
import KeywordsWordCloud from "./KeywordsWordCloud";

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
  }, []);

  useEffect(() => {
    console.log(processingStatus);
  }, [processingStatus]);

  const TabsListData = [
    {
      value: "Sentiments",
      icon: LuSmile,
      content: <Sentiment data={postsData} />,
    },
    {
      value: "WordCloud",
      icon: LuCloud,
      content: <KeywordsWordCloud data={postsData} />,
    },
    {
      value: "Pie Chart",
      icon: LuDonut,
      content: <KeywordsPieChart data={postsData} />,
    },
    {
      value: "Posts Table",
      icon: LuTable,
      content: <PostsTable data={postsData} />,
    },
    {
      value: "Keyword Table",
      icon: VscSymbolKeyword,
      content: <KeywordTable data={postsData} />,
    },
    {
      value: "Posts Frequency",
      icon: LuChartSpline,
      content: <PostsFrequency data={postsData} />,
    },
    {
      value: "Sentiments Frequency",
      icon: RiBubbleChartLine,
      content: <EmotionsThroughoutDay data={postsData} />,
    },
  ];

  if (postsData.length === 0 && !processingStatus) {
    return <></>;
  }

  return (
    <>
      <Box position="relative" aria-busy="true" userSelect="none">
        <Tabs.Root
          defaultValue="Pie Chart"
          variant="enclosed"
          lazyMount
          // unmountOnExit
          // width="auto"
          // fitted
          css={{
            "--tabs-indicator-bg": "colors.orange.600",
            "--tabs-indicator-color": "colors.orange.600",
          }}
          data-state={postsData.length !== 0 ? "open" : "closed"}
          _open={{
            animation: "fade-in 800ms ease-out",
          }}
        >
          <Tabs.List rounded="l3" p="1" overflowX="scroll" bg="transparent">
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
          {processingStatus && (
            <Box
              position="absolute"
              inset="0"
              bg="rgba(23, 23, 27, 0.6)"
              backdropFilter="blur(4px)"
              // zIndex={10}
              // borderRadius="l3"
            >
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
        </Tabs.Root>
      </Box>
    </>
  );
}
