import { Flex, HStack, Text } from "@chakra-ui/react";

const config = [
  { emoji: "", color: "#009637", label: "All" },
  { emoji: "😊", color: "#009637", label: "Positive" },
  { emoji: "😐", color: "#52719c", label: "Neutral" },
  { emoji: "😠", color: "#aa0505", label: "Negative" },
];

export default function PostTableFilter({
  sentiment,
  onSentimentChange,
  topics,
  onTopicsChange,
}) {
  return (
    <>
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
              onSentimentChange(emotion.label);
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
              onTopicsChange(topic);
            }}
          >
            <Text fontSize="xx-small" fontWeight="bold" color="white">
              {topic}
            </Text>
          </Flex>
        ))}
      </HStack>
    </>
  );
}

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
