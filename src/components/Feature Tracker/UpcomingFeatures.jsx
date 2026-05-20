import {
  Box,
  HStack,
  VStack,
  Text,
  Heading,
  Card,
  Badge,
  Stack,
  Collapsible,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { LuChevronRight } from "react-icons/lu";

const DEFAULT_COLUMNS = ["Pending", "In Progress", "Completed"];

export default function UpcomingFeatures() {
  const [boardData, setBoardData] = useState(
    DEFAULT_COLUMNS.map((title) => ({ id: title, title, cards: [] })),
  );

  useEffect(() => {
    async function parseData() {
      try {
        const response = await fetch("./Tasks.csv");
        if (!response.ok) return;

        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const newBoard = DEFAULT_COLUMNS.map((title) => ({
              id: title,
              title,
              cards: [],
            }));

            result.data.forEach((task) => {
              const column = newBoard.find((col) => col.title === task.Status);
              if (column) {
                column.cards.push({
                  id: Math.random().toString(),
                  title: task.Task,
                  type: task.Type,
                });
              }
            });
            setBoardData(newBoard);
          },
        });
      } catch (error) {
        console.error("CSV Error:", error);
      }
    }

    parseData();
  }, []);

  return (
    <Collapsible.Root>
      <Collapsible.Trigger
        paddingY="3"
        display="flex"
        gap={2}
        alignItems="center"
      >
        <Collapsible.Indicator
          transition="transform 0.2s"
          _open={{ transform: "rotate(90deg)" }}
          color="orange.600"
        >
          <LuChevronRight />
        </Collapsible.Indicator>
        <Heading size="lg" color="orange.600">
          Upcoming Features
        </Heading>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <iframe
          src="https://tundra-monitor-40c.notion.site/ebd//8d0b8016801b4327bc1f61da619c353f?v=b668abc7fa5644feb0e94997b554d8a1"
          width="100%"
          height="600"
          allowFullScreen
          style={{
            marginTop: "-50px"
          }}
        />
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
