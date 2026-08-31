import {
  RangeFilter,
  TextSearch,
  ValueSearch,
} from "@/components/ui-components/Data Table/Filters";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import { sendingData, fetchingData, queryClient } from "@/util/http";
import { Button, HStack, Text, VStack, Checkbox } from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { ActionBar, Portal } from "@chakra-ui/react";
import { LuShare, LuTrash2 } from "react-icons/lu";

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
    return (
      <LoadingAndError isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <>
      <TanStackDataTable
        data={keywords}
        TableFiltersComponent={KeywordFilters}
        TableToolbarComponent={ToolBar}
        getRowId={(row) => row.word}
        enableRowSelection={(row) => !row.original.reported}
        tableColumns={[
          {
            accessorFn: (originalRow) => originalRow.word,
            id: (row) => row.word,
            header: ({ table }) => {
              let checked = false;
              const someChecked = table.getIsSomeRowsSelected();
              const allChecked = table.getIsAllRowsSelected();
              if (someChecked && !allChecked) {
                checked = "indeterminate";
              } else if (allChecked) {
                checked = true;
              }
              return (
                <Checkbox.Root
                  checked={checked}
                  onChange={table.getToggleAllRowsSelectedHandler()}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              );
            },
            cell: ({ row }) => (
              <Checkbox.Root
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onCheckedChange={row.getToggleSelectedHandler()}
                size="sm"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            ),
            size: 50,
            enableSorting: false,
          },
          {
            accessorKey: "word",
            header: "Word",
            cell: (props) => (
              <Button variant="plain" color="orange.400">
                {props.getValue()}
              </Button>
            ),
            filterFn: "includesString",
            sortingFn: "text",
          },
          {
            accessorKey: "frequency",
            header: "Count",
            cell: (props) => props.getValue(),
            filterFn: "inNumberRange",
            sortingFn: "alphanumeric",
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
            enableSorting: false,
          },
          {
            accessorKey: "reported",
            header: "",
            cell: ReportWord,
            filterFn: (row, columnID, filterValue) => {
              const value = row.getValue(columnID);
              if (filterValue) {
                return true;
              }
              if (filterValue === value) {
                return true;
              }
              return false;
            },
            enableSorting: false,
          },
        ]}
      />
    </>
  );
}

const ToolBar = ({ table }) => {
  // console.log(Object.keys(table.getState().rowSelection));
  // console.log(table.getSelectedRowModel().rows);
  if (table.getSelectedRowModel().rows.length !== 0) {
    return (
      <>
        <ActionBar.Root open>
          <Portal>
            <ActionBar.Positioner>
              <ActionBar.Content>
                <ActionBar.SelectionTrigger color="black">
                  {table.getSelectedRowModel().rows.length} selected
                </ActionBar.SelectionTrigger>
                <ActionBar.Separator />
                <Button variant="outline" size="sm" color="red">
                  <LuTrash2 />
                  Report as Useless
                </Button>
              </ActionBar.Content>
            </ActionBar.Positioner>
          </Portal>
        </ActionBar.Root>
      </>
    );
  }
};

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
