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
import { dateTimeFormatter } from "@/util/dateTime";
import type { RootState, SubredditsSummaryProps } from "@/util/Types";

export default function SubredditsSummary({
  showDashboard,
  toggleDashboard,
}: SubredditsSummaryProps) {
  const latestSummary = useSelector(
    (state: RootState) => state.serverStatusState.latestSummary,
  );
  const changeSinceLastLoad = useSelector(
    (state: RootState) => state.serverStatusState.changeSinceLastLoad,
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
                <Badge variant="solid">Last updated</Badge>
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
