import {
  Button,
  HStack,
  VStack,
  Blockquote,
  Text,
  Checkbox,
  Flex,
  Center,
  Spinner,
  Highlight
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import ProgressBar from "../../ui-components/ProgressBar.jsx";
import formatTime from "../../../util/formatTime.js";
import { useSelector } from "react-redux";
import DateSelector from "../../ui-components/DateSelector.jsx";
import { BASE_URL, wsUrl } from "../../../Constants.js";

const analysisTypesValues = ["Keywords", "Sentiment", "Entities", "Topic"];

export default function ReanalyzeSection() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Connecting...");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const cacheSummary = useSelector(
    (state) => state.serverStatusState.cacheSummary,
  );
  const token = useSelector((state) => state.authState.token);

  const loadingData = Object.keys(cacheSummary).length === 0;

  // Data to be sent
  const [subredditIDS, setSubredditIDS] = useState([]);
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [onlyNull, setOnlyNull] = useState(false);
  const date = new Date();

  let day = parseInt(date.getDate()) < 10 ? "0" + date.getDate() : date.getDate();
  let month = parseInt(date.getMonth()) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
  let year = date.getFullYear();
  let currentDate = `${year}-${month}-${day}`;
  const [dateRange, setDateRange] = useState(["2026-01-01", currentDate]);

  // Processing
  const [processed, setProcessed] = useState(0);
  const [totalPost, setTotalPosts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");

  const socketRef = useRef(null);

  // Track structural timing metrics using mutable references to avoid closure stale snapshots
  const lastTimeRef = useRef(null);
  const avgTimePerPostRef = useRef(null);

  useEffect(() => {
    let isCurrent = true;
    let socket = null;

    const establishSecureConnection = async () => {
      try {
        if (!token) {
          if (isCurrent) setStatus("Authentication Missing");
          return;
        }

        // 1. Request short-lived transaction authorization validation ticket profile
        const response = await fetch(`${BASE_URL}/ws/ticket`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to claim high-security pipeline ticket validation profile.");
        }

        const { ticket } = await response.json();
        

        // Safe unmount abort branch guard checkpoint 
        if (!isCurrent) return;

        // 2. Open channels using safe verification keys
        socket = new WebSocket(`${wsUrl}?ticket=${ticket}`);
        socketRef.current = socket;

        socket.onopen = () => {
          if (isCurrent) setStatus("Connected");
        };

        socket.onmessage = (event) => {
          if (!isCurrent) return;
          const data = JSON.parse(event.data);

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
              const duration = (currentTime - lastTimeRef.current) / 1000;

              if (duration > 0 && duration < 60) {
                if (avgTimePerPostRef.current === null) {
                  avgTimePerPostRef.current = duration;
                } else {
                  avgTimePerPostRef.current =
                    avgTimePerPostRef.current * 0.9 + duration * 0.1;
                }

                const remainingPosts = currentTotal - currentProcessed;
                if (remainingPosts > 0 && avgTimePerPostRef.current > 0) {
                  const totalSecondsLeft = remainingPosts * avgTimePerPostRef.current;
                  setTimeRemaining(formatTime(totalSecondsLeft));
                } else {
                  setTimeRemaining("0s");
                }
              }
            }
            lastTimeRef.current = currentTime;
          } else if (
            ["status", "info", "warning", "error"].includes(data.type)
          ) {
            setStatus(data.message);
            setLoading(false);
            setCurrentStatus(data.current_status || "");

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
          console.error("WebSocket Error Encountered:", error);
          if (isCurrent) setStatus("Connection Error");
        };

      } catch (err) {
        console.error("Initialization pipeline connection failure:", err);
        if (isCurrent) setStatus("Authentication Error");
      }
    };

    establishSecureConnection();

    return () => {
      isCurrent = false;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [token]);

  function selectAllSubreddits() {
    const allSubreddits = [];
    Object.values(cacheSummary).map((e) => {
      allSubreddits.push(e.id);
    });
    setSubredditIDS(allSubreddits);
  }

  function handleAnalysisTypes(type, checked) {
    if (type === "Keywords") {
      selectAllSubreddits();
    }

    const currentTypes = [...analysisTypes];
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

    if (analysisTypes.findIndex((e) => e === "keywords") !== -1) {
      selectAllSubreddits();
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
      `Do you want to start analysis on ${analysisTypes} from ${dateRange[0]} to ${dateRange[1]} with Only Null as ${onlyNull}`,
    );
    if (!confirmStart) {
      return;
    }

    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      confirmStart
    ) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.error("Cannot execute payload broadcast channel: Channel state disconnected.");
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
          <Center h="full">
            <Spinner
              borderWidth="4px"
              size="xl"
              color="orange.600"
              animationDuration="0.6s"
            />
          </Center>
        ) : (
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
          <Blockquote.Content fontSize="2xl">
            <Highlight query={"Connected"} styles={{ color: "gray.100", backgroundColor: "green.600", padding: 1, borderRadius: 3 }}>
              {status}
            </Highlight>
          </Blockquote.Content>
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