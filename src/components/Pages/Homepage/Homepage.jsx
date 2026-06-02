import { useState, useEffect } from "react";
import ServerStatus from "../../ui-components/ServerStatus.jsx";
import Header from "../../ui-components/Header.jsx";
import { Flex } from "@chakra-ui/react";
import UserInput from "./UserInput.jsx";
import SubredditsSuggestions from "./SubredditsSuggestion.jsx";
import DataTabs from "./Data/DataTabs.jsx";
import UpcomingFeatures from "../../Feature Tracker/UpcomingFeatures.jsx";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { serverStatusActions } from "../../../store/serverStatus.js";
import { BASE_URL } from "../../../Constants.js";

export default function Homepage() {
  const [posts, setPosts] = useState([]);
  const [processingStatus, setProcessingStatus] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    async function fetchPostData() {
      const response = await fetch(BASE_URL + "/summary");
      const resData = await response.json();
      if (!response.ok) {
        dispatch(serverStatusActions.serverStatusChange("offline"));
        throw new Error(resData.message || "Server is Offline!");
      } else {
        dispatch(serverStatusActions.serverStatusChange("online"));
      }

      dispatch(serverStatusActions.updateCacheSummary(resData));
    }

    fetchPostData();
  }, [dispatch]);

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
        <Link to="/dashboard">
          <ServerStatus />
        </Link>
      </Flex>

      <Flex justifyContent="center" gap="2" margin="5" flexDirection="column">
        <UserInput
          onFetchData={fetchSubredditData}
          processingStatus={processingStatus}
        />
        <SubredditsSuggestions />
      </Flex>

      {(posts.length !== 0 || processingStatus) && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <DataTabs postsData={posts} processingStatus={processingStatus} />
        </Flex>
      )}
      {import.meta.env.PROD && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <UpcomingFeatures />
        </Flex>
      )}
    </Flex>
  );
}
