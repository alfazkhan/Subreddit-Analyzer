import DataPagination from "@/components/ui-components/DataPagination";
import paginationDataSlicer from "../../../../util/paginationDataSlicer";
import {
  Table,
  Badge,
  Flex,
  Text,
  Collapsible,
  Stack,
  Button,
  Link,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";

import { LuChevronDown } from "react-icons/lu";
import DataTable from "@/components/ui-components/DataTable";
import PostTableFilter from "./PostTableFilters";

export default function KeywordTable({ data: postsData }) {
  const [sentiment, setSentiment] = useState("All");
  const [topics, setTopics] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); //Will be implemented later

  let filteredData = postsData;

  if (sentiment !== "All") {
    filteredData = postsData.filter((post) => {
      if (!post.sentiment) {
        return;
      }
      return post.sentiment === sentiment;
    });
  }

  if (topics !== "All") {
    filteredData = postsData.filter((post) => {
      if (!post.topics) {
        return;
      }
      return JSON.parse(post.topics).primary_topic === topics;
    });
  }

  const totalItems = filteredData?.length || 0;

  function parseTopics(topicData) {
    const parsedData = JSON.parse(topicData);
    if (Object.keys(parsedData).length === 0) {
      return <Text>No Data</Text>;
    }
    return (
      <>
        {parsedData?.labels.map((label, idx) => {
          return (
            <Badge
              key={idx}
              colorPalette={
                label === parsedData.primary_topic ? "green" : "gray"
              }
              variant={label === parsedData.primary_topic && "solid"}
              size={label === parsedData.primary_topic ? "lg" : "xs"}
            >
              <Text key={idx}>{label}</Text>
              <Badge key={idx + "score"} size="xs" colorPalette="yellow">
                {(parsedData.scores[idx] * 100).toFixed(2)}%
              </Badge>
            </Badge>
          );
        })}
      </>
    );
  }

  function parseEntities(entitiesData, id) {
    const parsedData = JSON.parse(entitiesData);
    if (parsedData.length === 0 || !Array.isArray(parsedData)) {
      return <p>No entities data</p>;
    }
    return parsedData
      .filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.label === item.label),
      )
      .map((e, idx) => {
        if (labelConfig[e.label] !== undefined) {
          return (
            <Badge
              id={labelConfig[e.label]?.type}
              colorPalette={labelConfig[e.label]?.color}
              key={idx}
            >
              {e.text} : {labelConfig[e.label]?.type}
            </Badge>
          );
        }
      });
  }

  const paginatedSlice = useMemo(() => {
    return paginationDataSlicer(filteredData, currentPage, pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <Flex direction="column">
      <PostTableFilter
        sentiment={sentiment}
        onSentimentChange={setSentiment}
        topics={topics}
        onTopicsChange={setTopics}
      />
      <Table.ScrollArea
        h="500px"
        borderWidth="1px"
        rounded="md"
        borderColor="gray.700"
      >
        <DataTable
          tableHeaders={[
            "Title",
            "Post",
            "Timestamp",
            "Sentiment",
            "Topics",
            "Entities",
          ]}
        >
          {paginatedSlice.map((post) => (
            <Table.Row key={post.id} color="gray.900">
              <Table.Cell maxW="200px" whiteSpace="normal" verticalAlign="top">
                <Link
                  color="blue.400"
                  href={`https://www.reddit.com/r/${post.subreddit}/comments/${post.id.substring(3)}`}
                >
                  {post.title}
                </Link>
              </Table.Cell>
              <Table.Cell maxW="300px" whiteSpace="normal" verticalAlign="top">
                <Collapsible.Root collapsedHeight="80px">
                  <Collapsible.Content>
                    <Stack>
                      {post.body ? (
                        post.body
                      ) : (
                        <Text color="red.400" textAlign="center">
                          No body content
                        </Text>
                      )}
                    </Stack>
                  </Collapsible.Content>
                  {post.body.length >= 300 && (
                    <Collapsible.Trigger asChild mt="3">
                      <Button
                        variant="solid"
                        size="xs"
                        fontSize="x-small"
                        // color="gray.400"
                        padding={1}
                        borderColor="gray.200"
                      >
                        <Collapsible.Context>
                          {(api) => (api.open ? "Show Less" : "Show More")}
                        </Collapsible.Context>
                        <Collapsible.Indicator
                          transition="transform 0.2s"
                          _open={{ transform: "rotate(180deg)" }}
                        >
                          <LuChevronDown />
                        </Collapsible.Indicator>
                      </Button>
                    </Collapsible.Trigger>
                  )}
                </Collapsible.Root>
              </Table.Cell>
              <Table.Cell>
                <Text>
                  {Intl.DateTimeFormat("en-DE", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  }).format(new Date(post.timestamp))}
                </Text>
                <Text>
                  {Intl.DateTimeFormat("en-DE", {
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric",
                    hour12: true,
                    timeZone: "Europe/Berlin",
                  }).format(new Date(post.timestamp))}
                </Text>
              </Table.Cell>
              <Table.Cell
                color={
                  config.find((element) => post.sentiment === element.label)
                    .color
                }
              >
                {post.sentiment}
              </Table.Cell>
              <Table.Cell>
                <Stack direction="column">
                  {!post.topics || Object.keys(post.topics).length === 0
                    ? "No Data Right now..."
                    : post.topics && parseTopics(post.topics)}
                </Stack>
              </Table.Cell>
              <Table.Cell>
                <Stack direction="column">
                  {post.entities && parseEntities(post.entities, post.id)}
                  {!post.entities && "No Data Right now..."}
                </Stack>
              </Table.Cell>
            </Table.Row>
          ))}
        </DataTable>
      </Table.ScrollArea>
      <DataPagination
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(newPage) => setCurrentPage(newPage)}
      />
    </Flex>
  );
}

const labelConfig = {
  PERSON: {
    type: "Person",
    description:
      "Real and fictional people (e.g., politicians, celebrities, users).",
    color: "blue",
  },
  NORP: {
    type: "Group",
    description: "Nationalities, religious, or political groups.",
    color: "purple",
  },
  FAC: {
    type: "Facility",
    description: "Buildings, airports, highways, bridges, and infrastructure.",
    color: "gray",
  },
  ORG: {
    type: "Organization",
    description: "Companies, agencies, institutions, and corporate brands.",
    color: "cyan",
  },
  GPE: {
    type: "Location (GPE)",
    description: "Countries, cities, and states.",
    color: "green",
  },
  LOC: {
    type: "Location",
    description: "Non-GPE locations like mountain ranges or bodies of water.",
    color: "teal",
  },
  PRODUCT: {
    type: "Product",
    description: "Objects, vehicles, foods, etc. (excludes services).",
    color: "orange",
  },
  EVENT: {
    type: "Event",
    description: "Named hurricanes, battles, wars, or sports events.",
    color: "pink",
  },
  WORK_OF_ART: {
    type: "Work of Art",
    description: "Titles of books, songs, movies, and TV shows.",
    color: "red",
  },
  LAW: {
    type: "Law",
    description: "Named documents made into laws (e.g., Section 144, GDPR).",
    color: "yellow",
  },
  LANGUAGE: {
    type: "Language",
    description: "Any specifically named language.",
    color: "blue",
  },
  DATE: {
    type: "Date",
    description: "Absolute or relative dates or time periods.",
    color: "facebook",
  },
  TIME: {
    type: "Time",
    description: "Times smaller than a day.",
    color: "messenger",
  },
  // PERCENT: {
  //   type: "Percentage",
  //   description: "Percentage values, including the '%' sign.",
  //   color: "whatsapp",
  // },
  MONEY: {
    type: "Money",
    description: "Monetary values, including units (e.g., INR, Euros).",
    color: "green",
  },
  QUANTITY: {
    type: "Quantity",
    description: "Measurements, such as weight or distance.",
    color: "yellow",
  },
  // ORDINAL: {
  //   type: "Ordinal",
  //   description: "Words describing order like 'first' or 'second'.",
  //   color: "gray",
  // },
  // CARDINAL: {
  //   type: "Number",
  //   description: "Numerals that do not fall under another category.",
  //   color: "gray",
  // },
};

const config = [
  { emoji: "", color: "#009637", label: "All" },
  { emoji: "😊", color: "#009637", label: "Positive" },
  { emoji: "😐", color: "#52719c", label: "Neutral" },
  { emoji: "😠", color: "#aa0505", label: "Negative" },
];

const topicsConfig = [
  // # Housing & Living Accommodations
  "Rent Prices & Affordability",
  "Apartment Viewings & Contracts",
  "Flatmates & Shared Housing",
  "Landlord Disputes & Evictions",
  "Utility Bills & Energy Costs",
  "Home Maintenance & Damage Repairs",

  // # Public Transit & Urban Mobility
  "Subway, Tram & Train Schedules",
  "Bus Routes & Reliability",
  "Transit Passes & Ticket Pricing",
  "Bicycle Lanes & Cycling Safety",
  "Traffic Congestion & Roadwork",
  "City Parking & Driving Permits",

  // # Local Administration, Law & Politics
  "City Registration & Paperwork",
  "Visas & Residence Permits",
  "Local Elections & Candidates",
  "City Council Policies & Budgets",
  "Protests, Strikes & Demonstrations",

  // # Jobs & Daily Economy
  "Job Postings & Career Advice",
  "Student Shifts & Part-Time Work",
  "Supermarket Prices & Groceries",
  "Salaries & Cost of Living Rants",

  // # Social Life, Culture & Recreation
  "Restaurant & Cafe Reviews",
  "Bars, Nightclubs & Nightlife",
  "Street Food & Local Cuisines",
  "Festivals, Concerts & Public Events",
  "Museums, Art & Theater",
  "Amateur Sports & Fitness Groups",

  // # Public Safety & Travel
  "Tourist Attractions & Sightseeing",
  "Neighborhood Safety & Crime Alerts",
  "Lost Items & Found Belongings",
];
