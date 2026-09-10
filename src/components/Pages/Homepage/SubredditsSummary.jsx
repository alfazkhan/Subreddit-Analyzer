import {
  FormatNumber,
  Button,
  Grid,
  Stat,
  HStack,
  VStack,
  Badge,
  Text,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";

export default function SubredditsSummary({ showDashboard, toggleDashboard }) {
  const latestSummary = useSelector(
    (state) => state.serverStatusState.latestSummary,
  );
  const changeSinceLastLoad = useSelector(
    (state) => state.serverStatusState.changeSinceLastLoad,
  );

  return (
    <VStack>
      <Grid templateColumns="repeat(6, 1fr)" gap="3" alignItems="center">
        {Object.keys(latestSummary).map((sub) => (
          <Stat.Root
            minH="10rem"
            minW="1rem"
            borderWidth="1px"
            p="3"
            rounded="md"
            key={sub}
          >
            <HStack justify="space-between">
              <Stat.Label color="white">r/{sub}</Stat.Label>
            </HStack>
            <Stat.ValueText color="orange.500">
              <FormatNumber value={latestSummary[sub]?.count} /> Posts
            </Stat.ValueText>
            <Stat.HelpText>
              <VStack gap={0.5}>
                <Badge>Last updated</Badge>
                <Text color="white">{dateTimeFormatter(latestSummary[sub]?.last_updated)}</Text>
              </VStack>
            </Stat.HelpText>
            {changeSinceLastLoad[sub] > 0 && (
              <Text fontSize="xs" p={2} borderWidth="0.5px" color="green.500">
                +{changeSinceLastLoad[sub]} new post/s
              </Text>
            )}
          </Stat.Root>
        ))}
      </Grid>
      <Button
        size="sm"
        mt={4}
        color="white"
        fontWeight="black"
        bg="orange.600"
        onClick={toggleDashboard}
      >
        {showDashboard ? "Close Dashboard" : "Show Dashboard"}
      </Button>
    </VStack>
  );
}

function dateTimeFormatter(rawTimestamp) {
  if (!rawTimestamp) return "N/A";

  const targetDate = new Date(rawTimestamp);
  if (isNaN(targetDate.getTime())) return "Invalid Date";

  const timeString = targetDate
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();

  const targetDay = new Date(targetDate);
  targetDay.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (targetDay.getTime() === today.getTime()) {
    return `Today at ${timeString}`;
  }

  if (targetDay.getTime() === yesterday.getTime()) {
    return `Yesterday at ${timeString}`;
  }

  const fullDateString = targetDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${fullDateString} ${timeString}`;
}
