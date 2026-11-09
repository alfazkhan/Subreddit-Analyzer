import {
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
  ButtonGroup,
  NativeSelect,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import { useMutation } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
import { LuChevronDown } from "react-icons/lu";
import { FaChevronLeft } from "react-icons/fa6";
import { FaChevronRight } from "react-icons/fa";
import type {
  FetchDataOptions,
  PaginatedPostsResponse,
  PaginationButtonsProps,
  PostTopics,
  PostTableCellProps,
  PostTitleCellProps,
  PostTimestampProps,
  RedditPost,
  TopicsCellProps,
} from "@/util/Types";

export default function PaginatedPostTable() {
  const [limit, setLimit] = useState(20);
  const [subreddit, setSubreddit] = useState("");
  const [posts, setPosts] = useState<PaginatedPostsResponse>({
    items: [],
    next_cursor: null,
    prev_cursor: null,
    has_more: false,
  });

  const { mutate, isPending } = useMutation<PaginatedPostsResponse, Error, FetchDataOptions>({
    mutationFn: fetchingData,
    onSuccess: (data) => {
      setPosts(data);
    },
  });

  function fetchPostsData(cursor: string | null = null, direction: "next" | "prev" = "next") {
    let endpoint = `posts?limit=${limit}&subreddit=${subreddit}&direction=${direction}`;
    if (cursor !== null) {
      endpoint += `&cursor=${cursor}`;
    }
    mutate({
      endpoint: endpoint,
      headers: { "Content-Type": "application/json" },
    });
  }

  useEffect(() => {
    fetchPostsData();
    console.log(limit);
  }, [limit]);

  // if (isError || isPending || isLoading) {
  //   return (
  //     <LoadingAndError isLoading={isPending} isError={isError} error={error} />
  //   );
  // }

  return (
    <Flex direction="column" width="full" gap={5} alignItems="center">
      <PaginationButtons
        data={posts}
        isPending={isPending}
        onFetchPosts={fetchPostsData}
        postPerPageChange={setLimit}
        limit={limit}
      />
      <TanStackDataTable
        data={posts?.items || []}
        manualPagination
        pageSize={limit}
        tableColumns={[
          {
            accessorKey: "subreddit_name",
            header: "Subreddit Name",
            cell: (props) => `r/${props.getValue<string>()}`,
          },
          {
            accessorKey: "title",
            header: "Title",
            cell: PostTitle,
            size: 200
          },
          {
            accessorKey: "body",
            header: "Body",
            cell: (props) => <PostBody bodyContent={props.getValue<string>()} />,
            size: 200
          },
          {
            accessorKey: "timestamp",
            header: "Timestamp",
            cell: (props) => <PostTimestamp timestamp={props.getValue<string>()} />,
          },
          {
            accessorKey: "sentiment",
            header: "Sentiment",
            cell: (props) => (
              <Text
                color={
                    config.find((element) => props.getValue<string>() === element.label)?.color ?? "gray.400"
                }
              >
                {props.getValue<string>()}
              </Text>
            ),
          },
          {
            accessorKey: "topics",
            header: "Post Topics",
            cell: (props) => <TopicsCell topics={props.getValue<PostTopics | null>()} />,
          },
        ]}
      />
      <PaginationButtons
        data={posts}
        isPending={isPending}
        onFetchPosts={fetchPostsData}
        postPerPageChange={setLimit}
        limit={limit}
      />
    </Flex>
  );
}

function PaginationButtons({
  data,
  onFetchPosts,
  isPending,
  limit,
  postPerPageChange,
}: PaginationButtonsProps) {
  return (
    <ButtonGroup size="sm" variant="outline">
      <Button
        onClick={() => onFetchPosts(data.prev_cursor, "prev")}
        disabled={data.prev_cursor === null}
      >
        <FaChevronLeft /> Previous
      </Button>
      {isPending && <p>Loading...</p>}
      <Button
        onClick={() => onFetchPosts(data.next_cursor, "next")}
        disabled={!data.has_more}
      >
        Next <FaChevronRight />
      </Button>
      <NativeSelect.Root size="sm" width="240px">
        <NativeSelect.Field
          value={limit}
          onChange={(event) => postPerPageChange(Number(event.currentTarget.value))}
        >
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </ButtonGroup>
  );
}

function PostTitle({ row }: PostTitleCellProps) {
  const { id, title, subreddit_name } = row.original;
  return (
    <Link
      color="blue.400"
      href={`https://www.reddit.com/r/${subreddit_name}/comments/${id.substring(3)}`}
    >
      {title}
    </Link>
  );
}

function PostBody({ bodyContent }: PostTableCellProps) {
  return (
    <Collapsible.Root collapsedHeight="80px">
      <Collapsible.Content>
        <Stack>
          {bodyContent ? (
            bodyContent
          ) : (
            <Text color="red.400" textAlign="center">
              No body content
            </Text>
          )}
        </Stack>
      </Collapsible.Content>
      {(bodyContent?.length ?? 0) >= 300 && (
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
  );
}

function PostTimestamp({ timestamp }: PostTimestampProps) {
  return (
    <>
      <Text>
        {Intl.DateTimeFormat("en-DE", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }).format(new Date(timestamp))}
      </Text>
      <Text>
        {Intl.DateTimeFormat("en-DE", {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
          timeZone: "Europe/Berlin",
        }).format(new Date(timestamp))}
      </Text>
    </>
  );
}

function TopicsCell({ topics }: TopicsCellProps) {
  if (!topics || Object.keys(topics).length === 0) {
    return <Text>No Data</Text>;
  }

  const topicsMap = new Map();
  topics.labels.map((label, index) => {
    topicsMap.set(label, topics.scores[index]);
  });

  return (
    <VStack>
      <Text>{topics.primary_topic}</Text>
      <Badge size="xs" colorPalette="yellow">
        {(topicsMap.get(topics.primary_topic) * 100).toFixed(2)}%
      </Badge>
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button size="2xs" variant="solid" borderColor="gray.200">
            All labels
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content overflow="scroll">
              <Popover.Arrow />
              {topics.labels.map((value) => (
                <Popover.Body key={value} bg="gray.800" p="2">
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
