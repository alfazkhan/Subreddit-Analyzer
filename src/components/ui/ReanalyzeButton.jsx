import { Button, HStack, VStack, Blockquote } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import ProgressBar from "./ProgressBar.jsx";

const BASE_URL = import.meta.env.PROD
  ? "api.theonlyalfaz.com"
  : "192.168.0.246:8000";

export default function ReanalyzeButton() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Idle");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");

  const socketRef = useRef(null);

  useEffect(() => {
    const wsUrl = `ws://${BASE_URL}/ws/reanalyze`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("Connected");
      console.log("WebSocket connection established.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Live Progress Data:", data);
      // Dynamically update UI state based on the payload type
      if (data.type === "progress" && data.percent !== undefined) {
        setProgress(data.percent);
        setStatus(data.message);
        setCurrentStatus(data.current_status);
      } else if (
        data.type === "status" ||
        data.type === "info" ||
        data.type === "warning" ||
        data.type === "error"
      ) {
        setStatus(data.message);
        console.log(data.message);
        setLoading(false);
        setCurrentStatus(data.current_status);
      } else if (data.type === "complete") {
        setProgress(100);
        setStatus(data.message);
        console.log(data.message);
        setCurrentStatus(data.current_status);
      } else {
        console.log(data);
        setStatus(data.message);
        setCurrentStatus(data.current_status);
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

  // Helper function to fire actions safely
  const sendAction = (actionName, keywordOnly) => {
    if (actionName === "pause" || actionName === "stop") {
      setLoading(true);
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          action: actionName,
          open_page: false,
          keywords_only: keywordOnly,
        }),
      );
    } else {
      console.error("Cannot send command: WebSocket is disconnected.");
    }
  };

  return (
    <VStack>
      <HStack
        width="full"
        gap="1"
        justifyContent="center"
        alignItems="baseline"
      >
        <ProgressBar value={progress} processingStatus={"Reanalyze Progress"} />
      </HStack>
      <HStack>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="green.600"
          marginBottom={2}
          disabled={loading}
          onClick={() => sendAction("start", true)}
        >
          Keyword-Only Reanalysis
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="red.700"
          marginBottom={2}
          disabled={loading}
          onClick={() => sendAction("start", false)}
        >
          Complete Re-Analysis
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          marginBottom={2}
          disabled={loading}
          onClick={() => sendAction("pause")}
        >
          Pause
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          marginBottom={2}
          disabled={loading}
          onClick={() => sendAction("resume")}
        >
          Resume
        </Button>
        <Button
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          marginBottom={2}
          disabled={loading}
          onClick={() => sendAction("stop")}
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
            {currentStatus.toUpperCase()}
          </Blockquote.Content>
        </Blockquote.Root>
      </HStack>
    </VStack>
  );
}
