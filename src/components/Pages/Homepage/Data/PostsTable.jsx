import {
  Table,
  Badge,
  Flex,
  Text,
  Collapsible,
  Stack,
  Button,
  Link,
  Popover,
  Portal,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { useState } from "react";

import { LuChevronDown } from "react-icons/lu";
import PostTableFilter from "./PostTableFilters";
import DataTable from "@/components/ui-components/Data Table/DataTable";

export default function PostsTable({ data: postsData }) {
  const [sentiment, setSentiment] = useState("All");
  const [topics, setTopics] = useState("All");

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

  function parseEntities(entitiesData) {
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

  console.log(filteredData);

  return (
    <Flex direction="column" width="full">
      <PostTableFilter
        sentiment={sentiment}
        onSentimentChange={setSentiment}
        topics={topics}
        onTopicsChange={setTopics}
      />
      <Table.ScrollArea
        // h="500px"
        borderWidth="1px"
        rounded="md"
        borderColor="gray.700"
      >
        <DataTable
          data={filteredData}
          tableHeaders={[
            "Title",
            "Post",
            "Timestamp",
            "Sentiment",
            "Topics",
            "Entities",
          ]}
          pageSize={5}
        >
          {(paginatedSlice) =>
            paginatedSlice.map((post) => (
              <Table.Row key={post.id} color="gray.900">
                <Table.Cell
                  maxW="200px"
                  whiteSpace="normal"
                  verticalAlign="top"
                >
                  <Link
                    color="blue.400"
                    href={`https://www.reddit.com/r/${post.subreddit}/comments/${post.id.substring(3)}`}
                  >
                    {post.title}
                  </Link>
                </Table.Cell>
                <Table.Cell
                  maxW="300px"
                  whiteSpace="normal"
                  verticalAlign="top"
                >
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
                  <TopicsCell topics={post.topics} />
                </Table.Cell>
                <Table.Cell>
                  <Stack direction="column">
                    {post.entities && parseEntities(post.entities, post.id)}
                    {!post.entities && "No Data Right now..."}
                  </Stack>
                </Table.Cell>
              </Table.Row>
            ))
          }
        </DataTable>
      </Table.ScrollArea>
    </Flex>
  );
}

function TopicsCell({ topics }) {
  if (Object.keys(topics).length === 0) {
    return <Text>No Data</Text>;
  }

  const parsedData = JSON.parse(topics);

  const topicsMap = new Map();
  parsedData.labels.map((label, index) => {
    topicsMap.set(label, parsedData.scores[index]);
  });

  return (
    <VStack>
      <Badge
        key={parsedData.primary_topic}
        colorPalette="green"
        variant="solid"
        size="lg"
      >
        <Text>{parsedData.primary_topic}</Text>
        <Badge size="xs" colorPalette="yellow">
          {(topicsMap.get(parsedData.primary_topic) * 100).toFixed(2)}%
        </Badge>
      </Badge>
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button size="xs" variant="solid" borderColor="gray.200" p="1">
            All labels
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content overflow="scroll">
              <Popover.Arrow />
              {parsedData.labels.map((value) => (
                <Popover.Body bg="gray.800" p="2" >
                  <HStack>
                    <Text>{value}</Text>
                    <Badge size="xs" colorPalette="red">
                      {(topicsMap.get(value) * 100).toFixed(2)}%
                    </Badge>
                  </HStack>
                </Popover.Body>
              ))}
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </VStack>
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
