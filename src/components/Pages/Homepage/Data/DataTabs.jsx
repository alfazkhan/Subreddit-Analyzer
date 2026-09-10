import { Tabs, Box, Center, Spinner } from "@chakra-ui/react";
import {
  LuUser,
  LuCloud,
  LuSmile,
  LuDonut,
  LuTable,
  LuChartSpline,
  LuGitlab,
} from "react-icons/lu";
import { RiBubbleChartLine } from "react-icons/ri";
import { VscSymbolKeyword } from "react-icons/vsc";
import KeywordTable from "./KeywordTable";
import Sentiment from "../Data/Sentiment";
import KeywordsPieChart from "../Data/KeywordsPieChart";
import PostsTable from "../Data/PostsTable";
import PostsFrequency from "../Data/PostsFrequency";
import EmotionsThroughoutDay from "../Data/EmotionsThroughoutDay";
import KeywordsWordCloud from "./KeywordsWordCloud";
import KPIAnalyticsChart from "./KPIAnalyticsChart";
import PaginatedPostTable from "./PaginatatedPostTable";

export default function DataTabs({ postsData, processingStatus }) {


  const TabsListData = [
    {
      value: "KPIs",
      icon: LuGitlab,
      render: () => <KPIAnalyticsChart />,
    },
    {
      value: "Sentiments",
      icon: LuSmile,
      render: () => <Sentiment data={postsData} />,
    },
    {
      value: "WordCloud",
      icon: LuCloud,
      render: () => <KeywordsWordCloud data={postsData} />,
    },
    {
      value: "Pie Chart",
      icon: LuDonut,
      render: () => <KeywordsPieChart data={postsData} />,
    },
    {
      value: "Posts Table",
      icon: LuTable,
      render: () => <PaginatedPostTable />,
    },
    {
      value: "Keyword Table",
      icon: VscSymbolKeyword,
      render: () => <KeywordTable data={postsData} />,
    },
    {
      value: "Posts Frequency",
      icon: LuChartSpline,
      render: () => <PostsFrequency data={postsData} />,
    },
    {
      value: "Sentiments Frequency",
      icon: RiBubbleChartLine,
      render: () => <EmotionsThroughoutDay data={postsData} />,
    },
  ];

  // if (postsData.length === 0 && !processingStatus) {
  //   return <></>;
  // }

  return (
    <>
      <Box position="relative" aria-busy="true" userSelect="none">
        <Tabs.Root
          defaultValue="Posts Table"
          variant="enclosed"
          lazyMount
          unmountOnExit
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
          <Tabs.List rounded="l3" p="1"  bg="transparent">
            {TabsListData.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
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
            <Tabs.Content key={tab.value} value={tab.value} >
              {tab.render()}
            </Tabs.Content>
          ))}
          {processingStatus && (
            <Box
              position="absolute"
              inset="0"
              bg="rgba(23, 23, 27, 0.6)"
              backdropFilter="blur(4px)"
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