import { useState, useEffect } from "react";
import ServerStatus from "../../ui-components/ServerStatus.jsx";
import Header from "../../ui-components/Header.jsx";
import { Flex } from "@chakra-ui/react";
import UserInput from "./UserInput.jsx";
import SubredditsSuggestions from "./SubredditsSuggestion.jsx";
import DataTabs from "./Data/DataTabs.jsx";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { fetchingData } from "@/util/http.js";
import LoadingAndError from "@/components/ui-components/LoadingAndError.jsx";

export default function Homepage() {
  const [processingStatus, setProcessingStatus] = useState(false);
  const [fetchingEnabled, setFetchingEnabled] = useState(false);
  const subreddit = useSelector((state) => state.userInputState.subredditName);
  const targetCount = useSelector(
    (state) => state.userInputState.targetPostCount,
  );

  // async function fetchSubredditData(subredditName, currentCount) {
  //   setProcessingStatus(true);
  //   const response = await fetch(
  //     `${BASE_URL}/posts/${subredditName}?limit=${currentCount}`,
  //   );
  //   const resData = await response.json();

  //   if (!response.ok) {
  //     throw new Error(resData.message || "Something went wrong!");
  //   } else {
  //     setProcessingStatus(false);
  //     setPosts(resData);
  //   }
  // }

  const {
    mutate,
    data: posts,
    isPending,
    isLoading,
    isError,
    error,
  } = useMutation({
    queryKey: ["posts", subreddit, targetCount],
    mutationFn: fetchingData,
  });

  let errorContent;

  if (isError || isPending || isLoading) {
    errorContent = (
      <LoadingAndError isLoading={isLoading} isError={isError} error={error} />
    );
  }

  function fetchSubredditData(subredditName, currentCount) {
    console.log(subredditName, currentCount);
    mutate({
      endpoint: `posts/${subredditName}?limit=${currentCount}`,
      headers: { "Content-Type": "application/json" },
    });
  }

  return (
    <Flex direction="column" justifyContent="center" width="80%" margin="auto">
      <Flex gap="4" align="anchor-center" justify="space-between" margin="5">
        <Header text={"Subreddit Analyzer"} highlight="Analyzer" />
        <ServerStatus />
      </Flex>

      <Flex justifyContent="center" gap="2" margin="5" flexDirection="column">
        <UserInput
          onFetchData={fetchSubredditData}
          processingStatus={isLoading}
        />
        <SubredditsSuggestions />
      </Flex>
      {/* <Flex justifyContent="center" gap="2" margin="5" flexDirection="column">
        <Logs/>
      </Flex> */}
      {errorContent && errorContent}
      <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
        <DataTabs postsData={posts || []} processingStatus={isPending} />
      </Flex>
      {/* {import.meta.env.PROD && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <UpcomingFeatures />
        </Flex>
      )} */}
    </Flex>
  );
}
