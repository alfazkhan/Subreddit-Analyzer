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
        <Box
          width="full"
          height="80vh"
          overflowX="auto"
          overflowY="auto"
          p="5"
          bg="blackAlpha.50"
          borderRadius="xl"
          css={{
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgb(255, 133, 72)",
              borderRadius: "20px",
              border: "2px solid transparent",
              backgroundClip: "content-box",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "orange.600",
            },
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(255, 133, 72) transparent",
          }}
        >
          <HStack
            alignItems="flex-start"
            gap="6"
            height="full"
            overflowY="auto"
          >
            {boardData.map((list) => (
              <VStack
                key={list.id}
                width="1/2"
                flex="1"
                bg="whiteAlpha.100"
                p="4"
                borderRadius="lg"
                alignItems="stretch"
                maxHeight="full"
                minH="200px"
                overflowY="auto"
                css={{
                  "&::-webkit-scrollbar": {
                    width: "8px",
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "20px",
                    border: "2px solid transparent",
                    backgroundClip: "content-box",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: "orange.600",
                  },
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255, 255, 255, 0.1) transparent",
                }}
              >
                <Heading size="sm" mb="4" color="orange.500">
                  {list.title}
                </Heading>

                <Stack
                  gap="4"
                  css={{
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                  }}
                >
                  {list.cards.length > 0 ? (
                    list.cards.map((item) => (
                      <Card.Root key={item.id} variant="outline" bg="gray.900">
                        <Card.Body p="4">
                          <Badge
                            colorPalette={
                              item.type === "Frontend" ? "blue" : "yellow"
                            }
                            mb="2"
                          >
                            {item.type === "Frontend" ? "React" : "Python"}
                          </Badge>
                          <Text fontWeight="medium" color="white">
                            {item.title}
                          </Text>
                        </Card.Body>
                      </Card.Root>
                    ))
                  ) : (
                    // 5. Visual feedback for empty columns
                    <Text
                      fontSize="xs"
                      color="whiteAlpha.400"
                      textAlign="center"
                      py="10"
                      borderStyle="dashed"
                      borderWidth="1px"
                      borderRadius="md"
                    >
                      Nothing in "{list.title}""
                    </Text>
                  )}
                </Stack>
              </VStack>
            ))}
          </HStack>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
