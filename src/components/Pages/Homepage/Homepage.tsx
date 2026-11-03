import { Flex, HStack, Progress } from "@chakra-ui/react";
import DataTabs from "./Data/DataTabs";

import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { fetchingData } from "@/util/http.js";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import { useState } from "react";
import SubredditsSummary from "./SubredditsSummary";
import type { ProgressBarProps, RootState } from "@/util/Types";

export default function Homepage() {
  const subreddit = useSelector(
    (state: RootState) => state.userInputState.subredditName,
  );
  const targetCount = useSelector(
    (state: RootState) => state.userInputState.targetPostCount,
  );

  const [progress, setProgress] = useState(0);
  const [showDashboard, setShowDashboard] = useState(true);

  const {
    mutate,
    data: posts = [],
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: fetchingData,
    onSuccess: () => {
      setProgress(0);
    },
  });

  let errorContent;

  if (isError || isPending) {
    errorContent = (
      <LoadingAndError isLoading={isPending} isError={isError} error={error} />
    );
  }

  function toggleDashboard() {
    setShowDashboard((prev) => !prev);
  }

  return (
    <Flex direction="column" justifyContent="center" width="full" margin="auto">
      <Flex justifyContent="center" gap="2" margin="5" flexDirection="column">
        <SubredditsSummary
          toggleDashboard={toggleDashboard}
          showDashboard={showDashboard}
        />
        {/* User input is not needed anymore */}
        {/* <UserInput onFetchData={fetchSubredditData} toggleDashboard={toggleDashboard} processingStatus={isPending} /> */}
      </Flex>
      {errorContent && errorContent}
      <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
        {isPending && <ProgressBar progressValue={progress} />}
        {showDashboard && (
          <DataTabs postsData={posts || []} processingStatus={isPending} />
        )}
      </Flex>
    </Flex>
  );
}

function ProgressBar({ progressValue }: ProgressBarProps) {
  return (
    <Progress.Root
      value={progressValue > 0 ? progressValue : null}
      colorPalette="orange"
      striped={progressValue > 0 && progressValue < 100}
      animated
    >
      <HStack>
        <Progress.Label>
          {progressValue < 100 ? "Downloading..." : "Downloaded"}
        </Progress.Label>
        <Progress.Track flex="1">
          <Progress.Range />
        </Progress.Track>
        <Progress.ValueText>{progressValue}%</Progress.ValueText>
      </HStack>
    </Progress.Root>
  );
}
