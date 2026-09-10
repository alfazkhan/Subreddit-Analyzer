import { useEffect, useState, useRef } from "react";
import {
  VStack,
  HStack,
  Badge,
  Text,
  Spinner,
  Center,
  Box,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { fetchingData } from "@/util/http";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import {
  TextSearch,
  ValueSearch,
} from "@/components/ui-components/Data Table/Filters";
import { BASE_URL } from "@/Constants";

const stripeStyle = {
  backgroundImage:
    "linear-gradient(45deg, rgba(255, 255, 255, 0.25) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.25) 75%, transparent 75%, transparent)",
  backgroundSize: "1rem 1rem",
  animation: "processStripes 1s linear infinite",
};

export default function ProcessQueueSection() {
  const token = useSelector((state) => state.authState.token);

  const [wsStatus, setWsStatus] = useState("Connecting...");
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const [queueTasks, setQueueTasks] = useState([]);
  const [queueCounts, setQueueCounts] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  // 1. Initial State Query via REST
  const {
    data: initialData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["scraping-queue"],
    queryFn: ({ signal }) => fetchingData({ endpoint: "queue", signal }),
    refetchInterval: wsStatus !== "Connected" ? 5000 : false,
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.counts) {
        setQueueCounts(initialData.counts);
      }
      if (Array.isArray(initialData.tasks)) {
        setQueueTasks(initialData.tasks);
      } else if (Array.isArray(initialData)) {
        setQueueTasks(initialData);
      }
    }
  }, [initialData]);

  // 2. Real-Time WebSocket Pipeline with Dynamic WS Protocol and URL Resolution
  useEffect(() => {
    let isMounted = true;

    const connectQueueSocket = () => {
      try {
        const parsedHttpUrl = new URL(BASE_URL);
        const wsProtocol = parsedHttpUrl.protocol === "https:" ? "wss:" : "ws:";
        const targetSocketUrl = `${wsProtocol}//${parsedHttpUrl.host}/ws/queue`;

        const socket = new WebSocket(targetSocketUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (isMounted) setWsStatus("Connected");
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "QUEUE_UPDATED") {
              if (payload.counts) {
                setQueueCounts(payload.counts);
              }
              if (Array.isArray(payload.data)) {
                setQueueTasks(payload.data);
              }
            }
          } catch (err) {
            console.error("Queue socket message error:", err);
          }
        };

        socket.onerror = () => {
          if (isMounted) setWsStatus("Connection Error");
        };

        socket.onclose = () => {
          if (isMounted) {
            setWsStatus("Disconnected");
            reconnectTimeoutRef.current = setTimeout(connectQueueSocket, 4000);
          }
        };
      } catch (err) {
        if (isMounted) {
          setWsStatus("Connection Error");
          reconnectTimeoutRef.current = setTimeout(connectQueueSocket, 4000);
        }
      }
    };

    connectQueueSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Center height="300px">
        <VStack gap={2}>
          <Spinner size="lg" color="orange.500" />
          <Text fontSize="xs" color="gray.400">
            Loading scraping queue tasks...
          </Text>
        </VStack>
      </Center>
    );
  }

  if (isError) {
    return (
      <Center height="300px">
        <Text color="red.400" fontSize="sm">
          Failed to fetch queue: {error?.message || "Internal Server Error"}
        </Text>
      </Center>
    );
  }

  return (
    <VStack width="full" align="stretch" gap={4}>
      {/* Keyframe Styling */}
      <style>{`
        @keyframes processStripes {
          0% { background-position: 0 0; }
          100% { background-position: 30px 0; }
        }
      `}</style>

      {/* Real-time Status Header */}
      <HStack justify="space-between" align="center" wrap="wrap" px={1}>
        <HStack gap={2}>
          <Text fontSize="md" fontWeight="bold" color="orange.400">
            Background Scraper & Processing Queue
          </Text>
          <Badge
            variant="solid"
            colorPalette={
              wsStatus === "Connected"
                ? "green"
                : wsStatus === "Connecting..."
                ? "yellow"
                : "red"
            }
            fontSize="2xs"
          >
            {wsStatus}
          </Badge>
        </HStack>

        <HStack gap={3}>
          <Badge variant="outline" colorPalette="gray" fontSize="xs">
            Total Tasks: {queueCounts.total.toLocaleString()}
          </Badge>
          <Badge variant="subtle" colorPalette="yellow" fontSize="xs">
            Pending: {queueCounts.pending.toLocaleString()}
          </Badge>
          <Badge
            variant="solid"
            colorPalette="blue"
            fontSize="xs"
            style={stripeStyle}
          >
            Processing: {queueCounts.processing.toLocaleString()}
          </Badge>
          <Badge variant="subtle" colorPalette="green" fontSize="xs">
            Completed: {queueCounts.completed.toLocaleString()}
          </Badge>
          {queueCounts.failed > 0 && (
            <Badge variant="subtle" colorPalette="red" fontSize="xs">
              Failed: {queueCounts.failed.toLocaleString()}
            </Badge>
          )}
        </HStack>
      </HStack>

      <TanStackDataTable
        data={queueTasks}
        getRowId={(row) => String(row.id || row.post_id)}
        TableFiltersComponent={QueueTableFilters}
        pageSize={15}
        tableColumns={[
          {
            accessorKey: "id",
            header: "Task ID",
            cell: (props) => (
              <Text fontSize="2xs" color="gray.500">
                {props.getValue() ?? "-"}
              </Text>
            ),
            size: 70,
          },
          {
            accessorKey: "post_id",
            header: "Post ID",
            cell: (props) => (
              <Text fontWeight="semibold" fontSize="xs">
                {props.getValue()}
              </Text>
            ),
            filterFn: (row, columnID, filterValue) => {
              if (!filterValue || filterValue.length < 2) return true;
              return String(row.getValue(columnID))
                .toLowerCase()
                .includes(filterValue.toLowerCase());
            },
            size: 130,
          },
          {
            accessorKey: "subreddit_name",
            header: "Subreddit",
            cell: (props) => (
              <Badge variant="outline" colorPalette="orange" size="xs">
                r/{props.getValue()}
              </Badge>
            ),
            filterFn: (row, columnID, filterValue) => {
              if (!filterValue || filterValue.length < 2) return true;
              return String(row.getValue(columnID))
                .toLowerCase()
                .includes(filterValue.toLowerCase());
            },
          },
          {
            accessorKey: "status",
            header: "Status",
            cell: (props) => {
              const val = String(props.getValue() || "").toLowerCase();
              if (val === "processing" || val === "running") {
                return (
                  <Badge
                    variant="solid"
                    colorPalette="blue"
                    size="xs"
                    fontWeight="extrabold"
                    style={stripeStyle}
                  >
                    PROCESSING
                  </Badge>
                );
              }

              let palette = "gray";
              if (val === "completed") palette = "green";
              else if (val === "failed") palette = "red";
              else if (val === "pending") palette = "yellow";

              return (
                <Badge variant="solid" colorPalette={palette} size="xs">
                  {val.toUpperCase()}
                </Badge>
              );
            },
            filterFn: "equals",
            size: 130,
          },
          {
            accessorKey: "retry_count",
            header: "Retries",
            cell: (props) => (
              <Text fontSize="xs">
                {props.getValue() ?? 0}
              </Text>
            ),
            size: 80,
          },
          {
            accessorKey: "created_at",
            header: "Discovered / Queued At",
            cell: (props) => (
              <Text fontSize="2xs" color="gray.400">
                {props.getValue() ? new Date(props.getValue()).toLocaleString() : "N/A"}
              </Text>
            ),
          },
        ]}
      />
    </VStack>
  );
}

const QueueTableFilters = ({ table }) => {
  return (
    <HStack gap={3} pb={2} wrap="wrap">
      <TextSearch
        table={table}
        fieldName="post_id"
        placeholder="Filter by Post ID..."
      />

      <TextSearch
        table={table}
        fieldName="subreddit_name"
        placeholder="Filter by Subreddit..."
      />

      <ValueSearch
        table={table}
        fieldName="status"
        options={[
          { value: "", text: "All Statuses" },
          { value: "pending", text: "Pending" },
          { value: "processing", text: "Processing" },
          { value: "completed", text: "Completed" },
          { value: "failed", text: "Failed" },
        ]}
      />
    </HStack>
  );
};