import { useState, useEffect, useRef } from "react";
import "./App.css";
import ServerStatus from "./components/ui/ServerStatus";
import Header from "./components/ui/Header";
import { Flex } from "@chakra-ui/react";
import UserInput from "./components/ui/UserInput.jsx";
import SubredditsSuggestions from "./components/ui/SubredditsSuggestion";
import ProgressBar from "./components/ui/ProgressBar";
import DataTabs from "./components/ui/DataTabs";
import UpcomingFeatures from "./components/Feature Tracker/UpcomingFeatures";

import { useSelector, useDispatch } from "react-redux";
import { serverStatusActions } from "./store/serverStatus";

const BASE_URL = import.meta.env.PROD
  ? "https://api.theonlyalfaz.com"
  : "http://192.168.0.246:8000";

function App() {
  //New States
  const [cacheSummary, setCacheSummary] = useState([]);
  const [posts, setPosts] = useState([]);
  const [processingStatus, setProcessingStatus] = useState(false);

  //Old States
  const [progress, setProgress] = useState(0);

  //Redux Variables
  const targetPostCount = useSelector(
    (state) => state.userInputState.targetPostCount,
  );
  const useOnlyCache = useSelector(
    (state) => state.userInputState.useOnlyCache,
  );
  const dispatch = useDispatch();

  const socketRef = useRef(null);
  const statusTimerRef = useRef(null);

  useEffect(() => {
    async function fetchPostData() {
      const response = await fetch(BASE_URL + "/summary");
      const resData = await response.json();
      console.log(resData);
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

  // useEffect(() => {
  //   const socket = new WebSocket("ws://192.168.0.246:8765");
  //   socketRef.current = socket;
  //   socket.onopen = () =>
  //     dispatch(serverStatusActions.serverStatusChange("online"));
  //   socket.onclose = () =>
  //     dispatch(serverStatusActions.serverStatusChange("offline"));

  //   socket.onmessage = (event) => {
  //     const message = JSON.parse(event.data);

  //     if (message.type === "cache_summary") {
  //       console.log(message);
  //       setCacheSummary(message.message);
  //     }

  //     if (message.type === "progress") {
  //       console.log(message);
  //       setProgress(message.value);
  //     }

  //     if (message.type === "status") {
  //       setProcessingStatus(message.message);
  //       console.log(message);
  //     }

  //     if (message.type === "delta_update") {
  //       console.log(message);

  //       if (statusTimerRef.current) {
  //         clearTimeout(statusTimerRef.current);
  //       }
  //       setProcessingStatus("Receiving deltas...");

  //       statusTimerRef.current = setTimeout(() => {
  //         setProcessingStatus("Scrolling further down...");
  //       }, 2000);
  //       setPosts((posts) => {
  //         const newPosts = [...posts];
  //         newPosts.push(message.post);
  //         return newPosts;
  //       });
  //       setProgress(message.progress);
  //     }

  //     if (message.type === "partial_data") {
  //       console.log(message);

  //       setProcessingStatus("Partial Data received");
  //       setProgress(Math.floor((message.posts.length / targetPostCount) * 100));
  //       setPosts(message.posts);
  //     }

  //     if (message.type === "final_data") {
  //       console.log(message);
  //       setProcessingStatus("Process Completed");
  //       setProgress(100);
  //       setPosts(message.posts);
  //     }
  //   };
  //   return () => {
  //     if (
  //       socket.readyState === WebSocket.OPEN ||
  //       socket.readyState === WebSocket.CONNECTING
  //     ) {
  //       socket.close();
  //     }
  //   };
  // }, []);

  async function fetchSubredditData(subredditName, currentCount) {
    setProcessingStatus(true);
    const response = await fetch(
      `${BASE_URL}/posts/${subredditName}?limit=${currentCount}`,
    );
    const resData = await response.json();
    // console.log(resData)

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
    </Flex>
  );
}

export default App;
