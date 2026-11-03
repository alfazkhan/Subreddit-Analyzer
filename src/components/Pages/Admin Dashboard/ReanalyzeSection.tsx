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
  Highlight,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import ProgressBar from "../../ui-components/ProgressBar";
import formatTime from "../../../util/formatTime";
import { useSelector } from "react-redux";
import DateSelector from "../../ui-components/DateSelector";
import { BASE_URL, wsUrl } from "../../../Constants";
import type { ReanalyzeSocketMessage, RootState } from "@/util/Types";

const analysisTypesValues = ["Keywords", "Sentiment", "Entities", "Topic"];

export default function ReanalyzeSection() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Connecting...");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const cacheSummary = useSelector(
    (state: RootState) => state.serverStatusState.latestSummary,
  );
  const token = useSelector((state: RootState) => state.authState.token);

  const loadingData = Object.keys(cacheSummary).length === 0;
  const [subredditIDS, setSubredditIDS] = useState<number[]>([]);
  const [analysisTypes, setAnalysisTypes] = useState<string[]>([]);
  const [onlyNull, setOnlyNull] = useState(false);
  const date = new Date();

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const currentDate = `${date.getFullYear()}-${month}-${day}`;
  const [dateRange, setDateRange] = useState<[string, string]>([
    "2026-01-01",
    currentDate,
  ]);

  const [processed, setProcessed] = useState(0);
  const [totalPost, setTotalPosts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");

  const socketRef = useRef<WebSocket | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const avgTimePerPostRef = useRef<number | null>(null);

  useEffect(() => {
    let isCurrent = true;
    let socket: WebSocket | null = null;

    const establishSecureConnection = async () => {
      try {
        if (!token) {
          if (isCurrent) setStatus("Authentication Missing");
          return;
        }

        const response = await fetch(`${BASE_URL}/ws/ticket`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            "Failed to claim high-security pipeline ticket validation profile.",
          );
        }

        const { ticket } = (await response.json()) as { ticket: string };
        if (!isCurrent) return;

        socket = new WebSocket(`${wsUrl}?ticket=${ticket}`);
        socketRef.current = socket;

        socket.onopen = () => {
          if (isCurrent) setStatus("Connected");
        };

        socket.onmessage = (event: MessageEvent<string>) => {
          if (!isCurrent) return;
          const data = JSON.parse(event.data) as ReanalyzeSocketMessage;

          if (data.type === "progress" && data.percent !== undefined) {
            const currentTime = Date.now();
            const currentTotal = data.total ?? 0;
            const currentProcessed = data.processed ?? 0;

            setTotalPosts(currentTotal);
            setProcessed(currentProcessed);
            setProgress(data.percent);
            setStatus(data.message);
            setCurrentStatus(data.current_status ?? "");

            if (
              lastTimeRef.current !== null &&
              data.current_status === "running"
            ) {
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
                  const totalSecondsLeft =
                    remainingPosts * avgTimePerPostRef.current;
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
            setCurrentStatus(data.current_status ?? "");

            if (data.current_status !== "running") {
              lastTimeRef.current = null;
            }
          } else if (data.type === "complete") {
            setProgress(100);
            setStatus(data.message);
            setCurrentStatus(data.current_status ?? "stopped");
            setTimeRemaining("");
            lastTimeRef.current = null;
            avgTimePerPostRef.current = null;
          } else {
            setStatus(data.message);
            setCurrentStatus(data.current_status ?? "");
          }
        };

        socket.onerror = (socketError) => {
          console.error("WebSocket Error Encountered:", socketError);
          if (isCurrent) setStatus("Connection Error");
        };
      } catch (error) {
        console.error("Initialization pipeline connection failure:", error);
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
    const allSubreddits = Object.values(cacheSummary).map((summary) => summary.id);
    setSubredditIDS(allSubreddits);
  }

  function handleAnalysisTypes(
    type: string,
    checked: boolean | "indeterminate",
  ) {
    if (type === "Keywords") {
      selectAllSubreddits();
    }

    const currentTypes = [...analysisTypes];
    const index = currentTypes.findIndex((value) => value === type.toLowerCase());
    if (index === -1 && checked) {
      currentTypes.push(type.toLowerCase());
      setAnalysisTypes(currentTypes);
    } else if (index !== -1) {
      currentTypes.splice(index, 1);
      setAnalysisTypes(currentTypes);
    }
  }

  function handleSubredditIDS(
    id: number,
    checked: boolean | "indeterminate",
  ) {
    const currentIDS = [...subredditIDS];
    const index = currentIDS.findIndex((value) => value === id);
    if (index === -1 && checked) {
      currentIDS.push(id);
      setSubredditIDS(currentIDS);
    } else if (index !== -1) {
      currentIDS.splice(index, 1);
      setSubredditIDS(currentIDS);
    }
  }

  const sendAction = (actionName: "start" | "pause" | "stop") => {
    if (actionName === "pause" || actionName === "stop") {
      setLoading(true);
    }

    if (actionName === "stop" || actionName === "pause") {
      lastTimeRef.current = null;
      setTimeRemaining("");
    }

    if (analysisTypes.includes("keywords")) {
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
    if (!confirmStart) return;

    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && confirmStart) {
      socket.send(JSON.stringify(data));
    } else {
      console.error(
        "Cannot execute payload broadcast channel: Channel state disconnected.",
      );
    }
  };

  const sendControlAction = (
    actionName: "pause" | "resume" | "stop",
  ) => {
    if (actionName === "pause" || actionName === "stop") setLoading(true);
    if (actionName === "stop" || actionName === "pause") {
      lastTimeRef.current = null;
      setTimeRemaining("");
    }
    if (socketRef.current?.readyState === WebSocket.OPEN) {
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
        <ProgressBar value={progress} processingStatus="Reanalyze Progress" />
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
            checked={analysisTypes.includes(type.toLowerCase())}
            onCheckedChange={(event) =>
              handleAnalysisTypes(type, event.checked)
            }
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
          Object.keys(cacheSummary).map((subreddit) => (
            <Checkbox.Root
              checked={subredditIDS.includes(cacheSummary[subreddit].id)}
              onCheckedChange={(event) =>
                handleSubredditIDS(cacheSummary[subreddit].id, event.checked)
              }
              key={cacheSummary[subreddit].id}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>{subreddit}</Checkbox.Label>
            </Checkbox.Root>
          ))
        )}
      </Flex>

      <HStack gap={4} borderWidth={0.5} p={5} borderColor="orange.400">
        <DateSelector
          start={dateRange[0]}
          end={dateRange[1]}
          onChange={(newStart, newEnd) =>
            setDateRange([newStart, newEnd])
          }
        />
      </HStack>

      <HStack>
        <Checkbox.Root
          checked={onlyNull}
          onCheckedChange={(event) => setOnlyNull(!!event.checked)}
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
            <Highlight
              query="Connected"
              styles={{
                color: "gray.100",
                backgroundColor: "green.600",
                padding: 1,
                borderRadius: 3,
              }}
            >
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
