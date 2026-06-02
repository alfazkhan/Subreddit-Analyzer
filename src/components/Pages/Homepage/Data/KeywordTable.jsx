import keywordCount from "../../../../util/keywordCount.js";
import getTopKeywords from "../../../../util/getTopKeywords.js";
import {
  HStack,
  Table,
  Field,
  NumberInput,
  Flex,
  Button,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

export default function KeywordTable({ data }) {
  const [minValue, setMinValue] = useState(20);
  const [maxValue, setMaxValue] = useState(100);

  const keywordsCount = keywordCount(data);


  let chartData = useMemo(() => {
    const entries = Object.entries(keywordsCount).reduce(
      (acc, [keyword, count]) => {
        if (count >= minValue && count <= maxValue) {
          acc.push({
            id: keyword,
            name: keyword,
            value: count,
          });
        }
        return acc;
      },
      [],
    );
    const sorted = entries.sort((a, b) => b.value - a.value);
    return sorted;
  }, [keywordsCount, minValue, maxValue]);

  return (
    <Flex direction="column">
      <HStack mb={5} justifyContent="space-around">
        <Field.Root required alignItems="center">
          <Field.Label>
            Min Frequency <Field.RequiredIndicator />
          </Field.Label>
          <NumberInput.Root
            value={minValue}
            width="50%"
            allowMouseWheel
            onValueChange={(details) => setMinValue(details.valueAsNumber)}
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          {/* <Field.HelperText>
            Enter Number of Posts to be scrapped
          </Field.HelperText> */}
        </Field.Root>
        <Field.Root required alignItems="center">
          <Field.Label>
            Max Frequency <Field.RequiredIndicator />
          </Field.Label>
          <NumberInput.Root
            value={maxValue}
            width="50%"
            allowMouseWheel
            onValueChange={(details) => setMaxValue(details.valueAsNumber)}
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          {/* <Field.HelperText>
            Enter Number of Posts to be scrapped
          </Field.HelperText> */}
        </Field.Root>
      </HStack>
      <HStack>
        <Button
          key="top10"
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          onClick={() =>
            getTopKeywords(keywordsCount, 10, setMinValue, setMaxValue)
          }
          marginBottom={2}
          minW={"100px"}
        >
          Get Top 10
        </Button>
        <Button
          key="top10"
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          onClick={() =>
            getTopKeywords(keywordsCount, 50, setMinValue, setMaxValue)
          }
          marginBottom={2}
          minW={"100px"}
        >
          Get Top 50
        </Button>
        <Button
          key="top10"
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          onClick={() =>
            getTopKeywords(keywordsCount, 100, setMinValue, setMaxValue)
          }
          marginBottom={2}
          minW={"100px"}
        >
          Get Top 100
        </Button>
      </HStack>

      <Table.ScrollArea
        h="500px"
        borderWidth="1px"
        rounded="md"
        css={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <Table.Root colorScheme="orange" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Keyword
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Count
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {chartData.map((item, idx) => (
              <Table.Row key={idx + item} color="orange.600">
                <Table.Cell>{item.name}</Table.Cell>
                <Table.Cell>{item.value}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Flex>
  );
}
