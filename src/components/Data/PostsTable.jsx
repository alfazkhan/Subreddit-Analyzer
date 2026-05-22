import {
  HStack,
  Table,
  Badge,
  Flex,
  Pagination,
  ButtonGroup,
  IconButton,
  Text,
  Collapsible,
  Stack,
  Button,
  Link,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { LuChevronDown } from "react-icons/lu";

const config = [
  { emoji: "", color: "#009637", label: "All" },
  { emoji: "😊", color: "#009637", label: "Positive" },
  { emoji: "😐", color: "#52719c", label: "Neutral" },
  { emoji: "😠", color: "#aa0505", label: "Negative" },
];

export default function KeywordTable({ data: postsData }) {
  const [sentiment, setSentiment] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  let data = postsData;

  if (sentiment !== "All") {
    data = postsData.filter((post) => post.sentiment === sentiment);
  }

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage]);

  function parseTopics(topicData) {
    console.log(JSON.parse(topicData));
    return (
      <>
        <Badge colorPalette="green" variant="solid">
          {JSON.parse(topicData)?.primary_topic}
        </Badge>
      </>
    );
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
              setCurrentPage(1);
            }}
          >
            <Text>{emotion.emoji}</Text>
            <Text fontWeight="bold" color="white">
              {emotion.label}
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
        <Table.Root variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Title
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Post
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Timestamp
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Sentiment
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Topics
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Entities
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedData.map((post) => (
              <Table.Row key={post.id} color="gray.100">
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
                    {/* {JSON.parse(post.entities)
                      .filter(
                        (item, index, self) =>
                          index ===
                          self.findIndex((t) => t.label === item.label),
                      )
                      .map((e,idx) => {
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
                    {post.topics && parseTopics(post.topics)}
                    {!post.topics && "No Data Right now..."}
                  </Stack>
                </Table.Cell>
                <Table.Cell>
                  <Stack direction="column">
                    {JSON.parse(post.entities)
                      .filter(
                        (item, index, self) =>
                          index ===
                          self.findIndex((t) => t.label === item.label),
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
                      })}
                  </Stack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination.Root
        count={data.length}
        pageSize={pageSize}
        page={currentPage}
        onPageChange={(details) => setCurrentPage(details.page)}
      >
        <ButtonGroup variant="ghost" size="sm" wrap="wrap" mt={3}>
          <Pagination.PrevTrigger asChild color="gray.100">
            <IconButton>
              <LuChevronLeft />
            </IconButton>
          </Pagination.PrevTrigger>

          <Pagination.Items
            render={(page) => (
              <IconButton
                variant={{ base: "ghost", _selected: "outline" }}
                color="gray.100"
              >
                {page.value}
              </IconButton>
            )}
          />

          <Pagination.NextTrigger asChild color="gray.100">
            <IconButton>
              <LuChevronRight />
            </IconButton>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Pagination.Root>
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
