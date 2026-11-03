import { useEffect, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  VStack,
  HStack,
  Badge,
  Text,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import {
  TextSearch,
  ValueSearch,
} from "@/components/ui-components/Data Table/Filters";
import { BASE_URL } from "@/Constants";
import type {
  ProcessQueueTask,
  QueueApiResponse,
  QueueCounts,
  QueueSocketMessage,
  QueueTableFiltersProps,
} from "@/util/Types";

const stripeStyle = {
  backgroundImage:
    "linear-gradient(45deg, rgba(255, 255, 255, 0.25) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.25) 75%, transparent 75%, transparent)",
  backgroundSize: "1rem 1rem",
  animation: "processStripes 1s linear infinite",
};

const initialQueueCounts: QueueCounts = {
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
};

function mergeQueueCounts(
  current: QueueCounts,
  updates: Partial<QueueCounts>,
): QueueCounts {
  return {
    total: updates.total ?? current.total,
    pending: updates.pending ?? current.pending,
    processing: updates.processing ?? current.processing,
    completed: updates.completed ?? current.completed,
    failed: updates.failed ?? current.failed,
  };
}

const tableColumns: ColumnDef<ProcessQueueTask>[] = [
  {
    accessorKey: "id",
    header: "Task ID",
    cell: ({ getValue }) => (
      <Text fontSize="2xs" color="gray.500">
        {String(getValue() ?? "-")}
      </Text>
    ),
    size: 70,
  },
  {
    accessorKey: "post_id",
    header: "Post ID",
    cell: ({ getValue }) => (
      <Text fontWeight="semibold" fontSize="xs">
        {String(getValue() ?? "")}
      </Text>
    ),
    filterFn: (row, columnID, filterValue) => {
      const query = String(filterValue ?? "");
      return (
        query.length < 2 ||
        String(row.getValue(columnID))
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    },
    size: 130,
  },
  {
    accessorKey: "subreddit_name",
    header: "Subreddit",
    cell: ({ getValue }) => (
      <Badge variant="outline" colorPalette="orange" size="xs">
        r/{String(getValue() ?? "")}
      </Badge>
    ),
    filterFn: (row, columnID, filterValue) => {
      const query = String(filterValue ?? "");
      return (
        query.length < 2 ||
        String(row.getValue(columnID))
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const value = String(getValue() ?? "").toLowerCase();
      if (value === "processing" || value === "running") {
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

      const palette =
        value === "completed"
          ? "green"
          : value === "failed"
            ? "red"
            : value === "pending"
              ? "yellow"
              : "gray";

      return (
        <Badge variant="solid" colorPalette={palette} size="xs">
          {value.toUpperCase()}
        </Badge>
      );
    },
    filterFn: "equals",
    size: 130,
  },
  {
    accessorKey: "retry_count",
    header: "Retries",
    cell: ({ getValue }) => (
      <Text fontSize="xs">{String(getValue() ?? 0)}</Text>
    ),
    size: 80,
  },
  {
    accessorKey: "created_at",
    header: "Discovered / Queued At",
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <Text fontSize="2xs" color="gray.400">
          {value ? new Date(String(value)).toLocaleString() : "N/A"}
        </Text>
      );
    },
  },
];

export default function ProcessQueueSection() {
  const [wsStatus, setWsStatus] = useState("Connecting...");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [queueTasks, setQueueTasks] = useState<ProcessQueueTask[]>([]);
  const [queueCounts, setQueueCounts] = useState<QueueCounts>(initialQueueCounts);

  const {
    data: initialData,
    isLoading,
    isError,
    error,
  } = useQuery<QueueApiResponse | ProcessQueueTask[]>({
    queryKey: ["scraping-queue"],
    queryFn: ({ signal }) =>
      fetchingData({ endpoint: "queue", signal, headers: {} }),
    refetchInterval: wsStatus !== "Connected" ? 5000 : false,
  });

  useEffect(() => {
    if (!initialData) return;

    if (Array.isArray(initialData)) {
      setQueueTasks(initialData);
      return;
    }
    if (initialData.counts) {
      setQueueCounts((previous) =>
        mergeQueueCounts(previous, initialData.counts ?? {}),
      );
    }
    if (Array.isArray(initialData.tasks)) {
      setQueueTasks(initialData.tasks);
    }
  }, [initialData]);

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

        socket.onmessage = (event: MessageEvent<string>) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data) as QueueSocketMessage;
            if (payload.type === "QUEUE_UPDATED") {
              if (payload.counts) {
                setQueueCounts((previous) => ({
                  ...mergeQueueCounts(previous, payload.counts ?? {}),
                }));
              }
              if (Array.isArray(payload.data)) {
                setQueueTasks(payload.data);
              }
            }
          } catch (messageError) {
            console.error("Queue socket message error:", messageError);
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
      } catch {
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
      <style>{`
        @keyframes processStripes {
          0% { background-position: 0 0; }
          100% { background-position: 30px 0; }
        }
      `}</style>

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
        getRowId={(row: ProcessQueueTask) => String(row.id ?? row.post_id)}
        TableFiltersComponent={QueueTableFilters}
        pageSize={15}
        tableColumns={tableColumns}
      />
    </VStack>
  );
}

function QueueTableFilters({ table }: QueueTableFiltersProps = {}) {
  if (!table) return <></>;

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
}