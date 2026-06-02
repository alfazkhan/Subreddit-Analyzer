import DataPagination from "@/components/ui-components/DataPagination";
import paginationDataSlicer from "../../../../util/paginationDataSlicer";
import {
  HStack,
  Table,
  Badge,
  Flex,
  Text,
  Collapsible,
  Stack,
  Button,
  Link,
} from "@chakra-ui/react";
import { useState } from "react";

import { LuChevronDown } from "react-icons/lu";
import DataTable from "@/components/ui-components/DataTable";

export default function KeywordTable({ data: postsData }) {
  const [sentiment, setSentiment] = useState("All");
  const [topics, setTopics] = useState("All");
  const [dataSlice, setdataSlice] = useState([]);

  let data = postsData;

  if (sentiment !== "All") {
    data = postsData.filter((post) => post.sentiment === sentiment);
  }

  if (topics !== "All") {
    data = postsData.filter((post) => {
      return JSON.parse(post.topics).primary_topic === topics;
    });
  }

  function parseTopics(topicData) {
    const parsedData = JSON.parse(topicData);
    // console.log(parsedData.primary_topic);
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

  return (
    <Flex direction="column">
      <HStack
        width="full"
        justifyContent="space-around"
        gap="4"
        mb={4}
        borderWidth="0.1px"
        padding={3}
        borderColor="gray.700"
      >
        <Text fontSize="lg" fontWeight="bold">
          Filter Posts By
        </Text>
        {config.map((emotion) => (
          <Flex
            key={emotion.label}
            alignItems="center"
            borderRadius="xs"
            padding={2}
            cursor="pointer"
            backgroundColor={
              emotion.label === sentiment ? "orange.600" : "gray.800"
            }
            _hover={{ bg: "whiteAlpha.100" }}
            onClick={() => {
              setSentiment(emotion.label);
            }}
          >
            <Text>{emotion.emoji}</Text>
            <Text fontWeight="bold" color="white">
              {emotion.label}
            </Text>
          </Flex>
        ))}
      </HStack>
      <HStack
        width="full"
        justifyContent="space-around"
        gap="4"
        mb={4}
        borderWidth="0.1px"
        padding={3}
        borderColor="gray.700"
        overflowX="scroll"
      >
        <Text fontSize="lg" fontWeight="bold">
          Filter Posts By
        </Text>
        {topicsConfig.map((topic) => (
          <Flex
            key={topic}
            alignItems="center"
            borderRadius="xs"
            padding={2}
            cursor="pointer"
            backgroundColor={topic === topics ? "orange.600" : "gray.800"}
            _hover={{ bg: "whiteAlpha.100" }}
            onClick={() => {
              setTopics(topic);
            }}
          >
            <Text fontSize="xx-small" fontWeight="bold" color="white">
              {topic}
            </Text>
          </Flex>
        ))}
      </HStack>
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
          {dataSlice.map((post) => (
            <Table.Row key={post.id} color="gray.100">
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
                        color="gray.400"
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
                  {post.topics && parseTopics(post.topics)}
                  {!post.topics && "No Data Right now..."}
                </Stack>
              </Table.Cell>
              <Table.Cell>
                <Stack direction="column">
                  {/* {JSON.parse(post.entities)
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
                            {labelConfig[e.label]?.type}
                          </Badge>
                        );
                      }
                    })} */}
                  {post.entities && parseEntities(post.entities, post.id)}
                  {!post.entities && "No Data Right now..."}
                </Stack>
              </Table.Cell>
            </Table.Row>
          ))}
        </DataTable>
      </Table.ScrollArea>
      <DataPagination data={data} setPaginationData={setdataSlice} />
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
