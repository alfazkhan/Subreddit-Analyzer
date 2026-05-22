import { useState, useEffect, useRef } from "react";
import "./App.css";
import ServerStatus from "./components/ui/ServerStatus";
import Header from "./components/ui/Header";
import { Flex, Box, Collapsible } from "@chakra-ui/react";
import UserInput from "./components/ui/UserInput.jsx";
import SubredditsSuggestions from "./components/ui/SubredditsSuggestion";
import DataTabs from "./components/ui/DataTabs";
import UpcomingFeatures from "./components/Feature Tracker/UpcomingFeatures";

import { useDispatch } from "react-redux";
import { serverStatusActions } from "./store/serverStatus";
import ReanalyzeButton from "./components/ui/ReanalyzeButton";

const BASE_URL = import.meta.env.PROD
  ? "https://api.theonlyalfaz.com"
  : "http://192.168.0.246:8000";

function App() {
  //New States
  const [cacheSummary, setCacheSummary] = useState({});
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

      setCacheSummary(resData);
    }

    fetchPostData();
  }, []);

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
      console.log(resData);
    }
  }

  return (
    <Flex direction="column" justifyContent="center" width="80%" margin="auto">
      <Flex gap="4" align="anchor-center" justify="space-between" margin="5">
        <Header />
        <ServerStatus />
      </Flex>

      <Flex justifyContent="center" gap="2" margin="5" flexDirection="column">
        <UserInput
          onFetchData={fetchSubredditData}
          cacheSummary={cacheSummary}
          processingStatus={processingStatus}
        />
        <SubredditsSuggestions cacheSummary={cacheSummary} />
      </Flex>

      {/* {processingStatus && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <ProgressBar value={progress} processingStatus={processingStatus} />
        </Flex>
      )} */}

      {(posts.length !== 0 || processingStatus) && ( //Remove ! in the end
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <DataTabs postsData={posts} processingStatus={processingStatus} />
        </Flex>
      )}
      {import.meta.env.PROD && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <UpcomingFeatures />
        </Flex>
      )}

      <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
        <Collapsible.Root>
          <Collapsible.Trigger paddingY="3" backgroundColor="red.500" fontWeight="bolder" px={10}>
            DO NOT TOUCH!
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Box padding="4" borderWidth="1px">
              <ReanalyzeButton />
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Flex>
    </Flex>
  );
}

export default App;
