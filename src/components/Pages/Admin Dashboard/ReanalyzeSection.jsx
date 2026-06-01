import {
  Button,
  HStack,
  VStack,
  Blockquote,
  Text,
  Checkbox,
  Flex,
  Box,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import ProgressBar from "../../ui/ProgressBar.jsx";
import formatTime from "../../../util/formatTime.js";
import { useSelector } from "react-redux";
import DateSelector from "../../ui/DateSelector.jsx";
import { BASE_URL } from "../../../Constants.js";


const analysisTypesValues = ["Keywords", "Sentiment", "Entities", "Topic"];

export default function ReanalyzeSection() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Connecting...");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const cacheSummary = useSelector(
    (state) => state.serverStatusState.cacheSummary,
  );
  // console.log(cacheSummary);
  const loadingData = Object.keys(cacheSummary).length === 0;

  //Data to be sent
  const [subredditIDS, setSubredditIDS] = useState([]);
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [onlyNull, setOnlyNull] = useState(false);
  const [dateRange, setDateRange] = useState();

  //Processing
  const [processed, setProcessed] = useState(0);
  const [totalPost, setTotalPosts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");

  const socketRef = useRef(null);

  // Track structural timing metrics using mutable references to avoid closure stale snapshots
  const lastTimeRef = useRef(null);
  const avgTimePerPostRef = useRef(null);

  useEffect(() => {
    const wsUrl = import.meta.env.PROD
      ? "wss://api.theonlyalfaz.com/ws/reanalyze"
      : "ws://192.168.0.246:8000/ws/reanalyze";

    // console.log(`Connecting to WebSocket channel via: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("Connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log("Live Progress Data:", data);

      if (data.type === "progress" && data.percent !== undefined) {
        const currentTime = Date.now();
        const currentTotal = data.total;
        const currentProcessed = data.processed;

        setTotalPosts(currentTotal);
        setProcessed(currentProcessed);
        setProgress(data.percent);
        setStatus(data.message);
        setCurrentStatus(data.current_status);

        // --- TIME REMAINING CALCULATION LOGIC ---
        if (lastTimeRef.current !== null && data.current_status === "running") {
          // Calculate exact duration to process this individual item (in seconds)
          const duration = (currentTime - lastTimeRef.current) / 1000;

          // Prevent statistical anomalies if the browser was suspended or disconnected
          if (duration > 0 && duration < 60) {
            if (avgTimePerPostRef.current === null) {
              avgTimePerPostRef.current = duration;
            } else {
              // Apply a 10% smoothing factor (Exponential Moving Average) for stable ETA numbers
              avgTimePerPostRef.current =
                avgTimePerPostRef.current * 0.9 + duration * 0.1;
            }

            const remainingPosts = currentTotal - currentProcessed;
            if (remainingPosts > 0 && avgTimePerPostRef.current > 0) {
              const totalSecondsLeft =
                remainingPosts * avgTimePerPostRef.current;
              setTimeRemaining(formatTime(totalSecondsLeft));
            } else {
              setTimeRemaining("0s");
            }
          }
        }

        // Lock in timestamps for the next incoming iteration frame
        lastTimeRef.current = currentTime;
      } else if (
        data.type === "status" ||
        data.type === "info" ||
        data.type === "warning" ||
        data.type === "error"
      ) {
        setStatus(data.message);
        setLoading(false);
        setCurrentStatus(data.current_status || "");

        // Reset timing arrays if the stream is paused or stopped
        if (data.current_status !== "running") {
          lastTimeRef.current = null;
        }
      } else if (data.type === "complete") {
        setProgress(100);
        setStatus(data.message);
        setCurrentStatus(data.current_status || "stopped");
        setTimeRemaining("");
        lastTimeRef.current = null;
        avgTimePerPostRef.current = null;
      } else {
        setStatus(data.message);
        setCurrentStatus(data.current_status || "");
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus("Connection Error");
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  function handleAnalysisTypes(type, checked) {
    console.log(type.toLowerCase());
    const currentTypes = [...analysisTypes];
    // console.log(currentTypes);
    const index = currentTypes.findIndex((e) => e === type.toLowerCase());
    if (index === -1 && checked) {
      currentTypes.push(type.toLowerCase());
      setAnalysisTypes(currentTypes);
    } else {
      currentTypes.splice(index, 1);
      setAnalysisTypes(currentTypes);
    }
  }

  function handleSubredditIDS(id, checked) {
    const currentIDS = [...subredditIDS];
    console.log(id);
    const index = currentIDS.findIndex((e) => e === id);
    if (index === -1 && checked) {
      currentIDS.push(id);
      setSubredditIDS(currentIDS);
    } else {
      currentIDS.splice(index, 1);
      setSubredditIDS(currentIDS);
    }
  }

  const sendAction = (actionName) => {
    if (actionName === "pause" || actionName === "stop") {
      setLoading(true);
    }

    if (actionName === "stop" || actionName === "pause") {
      lastTimeRef.current = null;
      setTimeRemaining("");
    }

    const data = {
      action: actionName,
      pipelines: analysisTypes,
      only_null: onlyNull,
      subreddits: subredditIDS,
      start_date: dateRange[0],
      end_date: dateRange[1],
    };

    const confirmStart = confirm(
      `Do you want to start analysis on ${analysisTypes} from ${dateRange[0].split("-").reverse().join("-")} to ${dateRange[1].split("-").reverse().join("-")} with Only Null as ${onlyNull}`,
    );
    if (!confirmStart) {
      console.log(JSON.stringify(data));
      return;
    }

    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      confirmStart
    ) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.error("Cannot send command: WebSocket is disconnected.");
    }
  };

  const sendControlAction = (actionName) => {
    if (["pause", "stop"].includes(actionName)) setLoading(true);
    if (["stop", "pause"].includes(actionName)) {
      lastTimeRef.current = null;
      setTimeRemaining("");
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: actionName }));
    }
  };

  return (
    <VStack width="full" gap={4}>
      <HStack
        width="full"
        gap="1"
        justifyContent="center"
        alignItems="baseline"
      >
        <ProgressBar value={progress} processingStatus={"Reanalyze Progress"} />
      </HStack>

      {/* Real-time Meta Metrics Indicators Display */}
      {currentStatus === "running" && totalPost > 0 && (
        <HStack gap={6} fontSize="sm" color="gray.400" fontWeight="bold">
          <Text>
            Processed: {processed} / {totalPost}
          </Text>
          {timeRemaining && (
            <Text color="green.400">
              Estimated Time Remaining: {timeRemaining}
            </Text>
          )}
        </HStack>
      )}

      <HStack gap={4} borderWidth={0.5} p={5} borderColor="orange.400">
        {analysisTypesValues.map((type) => (
          <Checkbox.Root
            checked={
              analysisTypes.findIndex((e) => e === type.toLowerCase()) !== -1
            }
            onCheckedChange={(e) => handleAnalysisTypes(type, e.checked)}
            key={type}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>{type}</Checkbox.Label>
          </Checkbox.Root>
        ))}
      </HStack>

      <Flex
        borderWidth={0.5}
        p={5}
        borderColor="orange.400"
        overflow="scroll"
        flexWrap="wrap"
        gap={4}
      >
        {loadingData ? (
          // <Box pos="absolute" inset="0" bg="gray.700/80">
          <Center h="full">
            <Spinner
              borderWidth="4px"
              size="xl"
              color="orange.600"
              animationDuration="0.6s"
            />
          </Center>
        ) : (
          // </Box>
          Object.keys(cacheSummary).map((sub) => (
            <Checkbox.Root
              checked={
                subredditIDS.findIndex((e) => e === cacheSummary[sub].id) !== -1
              }
              onCheckedChange={(e) =>
                handleSubredditIDS(cacheSummary[sub].id, e.checked)
              }
              key={cacheSummary[sub].id}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>{sub}</Checkbox.Label>
            </Checkbox.Root>
          ))
        )}
      </Flex>

      <HStack gap={4} borderWidth={0.5} p={5} borderColor="orange.400">
        <DateSelector dateSetter={setDateRange} />
      </HStack>

      <HStack>
        <Checkbox.Root
          checked={onlyNull}
          onCheckedChange={(e) => setOnlyNull(!!e.checked)}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Only Null Fields</Checkbox.Label>
        </Checkbox.Root>
      </HStack>

      <HStack>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="red.700"
          disabled={loading || loadingData}
          onClick={() => sendAction("start")}
        >
          Start Analysis
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          disabled={loading || loadingData}
          onClick={() => sendControlAction("pause")}
        >
          Pause
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          disabled={loading || loadingData}
          onClick={() => sendControlAction("resume")}
        >
          Resume
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          disabled={loading || loadingData}
          onClick={() => sendControlAction("stop")}
        >
          Stop
        </Button>
      </HStack>

      <HStack mt={5}>
        <Blockquote.Root>
          <Blockquote.Content fontSize="2xl">{status}</Blockquote.Content>
          <Blockquote.Content
            fontSize="xl"
            color={currentStatus === "running" ? "green.500" : "yellow.400"}
          >
            <p>{currentStatus.toUpperCase()}</p>
            {avgTimePerPostRef.current && (
              <Text color="green.500">
                Avg Time Per Post:{" "}
                <span style={{ fontWeight: "bolder" }}>
                  {avgTimePerPostRef.current.toFixed(2)} seconds
                </span>
              </Text>
            )}
          </Blockquote.Content>
        </Blockquote.Root>
      </HStack>
    </VStack>
  );
}
