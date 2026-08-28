import {
  RangeFilter,
  TextSearch,
  ValueSearch,
} from "@/components/ui-components/Data Table/Filters";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import { sendingData, fetchingData, queryClient } from "@/util/http";
import { Button, HStack, Text, VStack } from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSelector } from "react-redux";

export default function KeywordTable() {
  const {
    data: keywords,
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["keywords"],
    queryFn: ({ signal }) => fetchingData({ endpoint: "keywords", signal }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  if (isError || isPending || isLoading) {
    return <LoadingAndError isLoading={isLoading} isError={isError} error={error} />;
  }

  return (
    <>
      <TanStackDataTable
        data={keywords}
        TableFiltersComponent={KeywordFilters}
        tableColumns={[
          {
            accessorKey: "word",
            header: "Word",
            cell: (props) => (
              <Button variant="plain" color="orange.400">
                {props.getValue()}
              </Button>
            ),
            filterFn: "includesString",
            sortingFn: "text"
          },
          {
            accessorKey: "frequency",
            header: "Count",
            cell: (props) => props.getValue(),
            filterFn: "inNumberRange",
            sortingFn: "alphanumeric"
          },
          {
            accessorKey: "sentiment_distribution",
            header: "Sentiment Distribution",
            cell: (props) => (
              <HStack gap={4}>
                <Text color="green">
                  Positive -{props.getValue()?.["positive"]}
                </Text>
                <Text color="gray">
                  Neutral -{props.getValue()?.["neutral"]}
                </Text>
                <Text color="red">
                  Negative -{props.getValue()?.["negative"]}
                </Text>
              </HStack>
            ),
            enableSorting: false
          },
          {
            accessorKey: "reported",
            header: "",
            cell: ReportWord,
            filterFn: (row, columnID, filterValue) => {
              const value = row.getValue(columnID);
              if(filterValue){
                return true
              }
              if(filterValue === value){
                return true
              }
              return false
            },
            enableSorting: false
          },
        ]}
      />
    </>
  );
}

const KeywordFilters = ({ table }) => {
  return (
    <VStack>
      <TextSearch
        fieldName={"word"}
        placeholder="Search Keyword..."
        table={table}
      />
      <RangeFilter fieldName="frequency" table={table} />
      <ValueSearch
        table={table}
        fieldName={"reported"}
        options={[
          { value: "true", text: "All" },
          { value: "false", text: "Hide Reported Word" },
        ]}
      />
    </VStack>
  );
};

const ReportWord = ({ row }) => {
  const { word } = row.original;
  const { reported } = row.original;

  const authState = useSelector((state) => state.authState);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: sendingData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ignored-words"] });
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
    },
  });

  function addIgnoredWord() {
    mutate({
      endpoint: `ignored-words`,
      body: [
        {
          word: `${encodeURIComponent(word)}`,
          language: "en",
        },
      ],
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.token}`,
      },
    });
  }

  return (
    <Button
      variant="solid"
      size="2xs"
      onClick={addIgnoredWord}
      colorPalette={reported ? "gray" : "red"}
      disabled={isPending}
    >
      {reported ? `Mark "${word}" as useful` : `Mark "${word}" as useless`}
    </Button>
  );
};
