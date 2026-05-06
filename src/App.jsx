import { useState, useEffect, useRef, useContext } from "react";
import "./App.css";
import ServerStatus from "./components/ui/ServerStatus";
import Header from "./components/ui/Header";
import { Flex } from "@chakra-ui/react";
import UserInput from "./components/ui/UserInput.jsx";
import SubredditsSuggestions from "./components/ui/SubredditsSuggestion";
import ProgressBar from "./components/ui/ProgressBar";
import DataTabs from "./components/ui/DataTabs";
import { SubredditContext } from "./store/SubredditContext";
import UpcomingFeatures from "./components/Feature Tracker/UpcomingFeatures";

function App() {
  const [progress, setProgress] = useState(0);
  const [posts, setPosts] = useState([]); // New state for raw post data
  const [status, setStatus] = useState("offline");
  const [processingStatus, setProcessingStatus] = useState(false);

  const { subredditName, targetPostCount, useOnlyCache } = useContext(SubredditContext);

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket("ws://192.168.0.246:8765");
    socketRef.current = socket;
    socket.onopen = () => setStatus("online");
    socket.onclose = () => setStatus("offline");

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "progress") {
        console.log(message);
        setProgress(message.value);
      }

      if (message.type === "status") {
        setProcessingStatus(message.message);
        console.log(message);
      }

      if (message.type === "delta_update") {
        console.log(message);
        setProcessingStatus("Receiving deltas...");
        setPosts((posts) => {
          const newPosts = [...posts];
          newPosts.push(message.post);
          return newPosts;
        });
        setProgress(message.progress);
      }

      if (message.type === "final_data") {
        console.log(message)
        setProcessingStatus("Process Completed");
        setProgress(100);
        setPosts(message.posts);
      }
    };
    return () => socket.close();
  }, []);

  function StartScraping() {
    setProcessingStatus("Sending Request...");
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      setPosts([]);
      setProgress(0);
      socket.send(
        JSON.stringify({
          type: "start_scrape",
          subreddit: subredditName,
          count: targetPostCount,
          useOnlyCache: useOnlyCache,
        }),
      );
    }
  }

  return (
    <Flex direction="column" justifyContent="center" width="80%" margin="auto">
      <Flex gap="4" align="anchor-center" justify="space-between" margin="5">
        <Header />
        <ServerStatus status={status} />
      </Flex>

      <Flex justifyContent="center" gap="2" margin="5" flexDirection="column">
        <UserInput onStart={StartScraping} />
        <SubredditsSuggestions />
      </Flex>

      {processingStatus && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <ProgressBar value={progress} processingStatus={processingStatus} />
        </Flex>
      )}

      {posts.length !== 0 && ( //Remove ! in the end
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <DataTabs postsData={posts} />
        </Flex>
      )}

      <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
        <UpcomingFeatures />
      </Flex>
    </Flex>
  );
}

export default App;
