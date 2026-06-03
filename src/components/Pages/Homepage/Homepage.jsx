import { useState, useEffect } from "react";
import ServerStatus from "../../ui-components/ServerStatus.jsx";
import Header from "../../ui-components/Header.jsx";
import { Flex } from "@chakra-ui/react";
import UserInput from "./UserInput.jsx";
import SubredditsSuggestions from "./SubredditsSuggestion.jsx";
import DataTabs from "./Data/DataTabs.jsx";
import UpcomingFeatures from "../../Feature Tracker/UpcomingFeatures.jsx";

import { BASE_URL } from "../../../Constants.js";
import Logs from "@/components/ui-components/Logs.jsx";

export default function Homepage() {
  const [posts, setPosts] = useState([]);
  const [processingStatus, setProcessingStatus] = useState(false);

  async function fetchSubredditData(subredditName, currentCount) {
    setProcessingStatus(true);
    const response = await fetch(
      `${BASE_URL}/posts/${subredditName}?limit=${currentCount}`,
    );
    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.message || "Something went wrong!");
    } else {
      setProcessingStatus(false);
      setPosts(resData);
    }
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
          processingStatus={processingStatus}
        />
        <SubredditsSuggestions />
      </Flex>
      {/* <Flex justifyContent="center" gap="2" margin="5" flexDirection="column">
        <Logs/>
      </Flex> */}

      {(posts.length !== 0 || processingStatus) && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <DataTabs postsData={posts} processingStatus={processingStatus} />
        </Flex>
      )}
      {/* {import.meta.env.PROD && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <UpcomingFeatures />
        </Flex>
      )} */}
    </Flex>
  );
}
