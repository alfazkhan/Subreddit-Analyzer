import {
  KeywordBaseFilters,
  RangeFilter,
} from "@/components/ui-components/Data Table/Filters";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import { LoadingAndError } from "@/components/ui-components/Feedback";
import {
  CheckboxField,
  getSelectionHeaderState,
} from "@/components/ui-components/FormControls";
import {
  createAuthHeaders,
  invalidateKeywordQueries,
  keywordsQueryOptions,
  sendingData,
} from "@/util/api";
import { Button, HStack, Text } from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { ActionBar, Portal } from "@chakra-ui/react";
import { LuTrash2 } from "react-icons/lu";
import type {
  KeywordItem,
  KeywordReportCellProps,
  KeywordTableControlProps,
  RootState,
} from "@/util/Types";

export default function KeywordTable() {
  const {
    data: keywords,
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery(keywordsQueryOptions);

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
            id: "select",
            header: ({ table }) => (
              <CheckboxField
                checked={getSelectionHeaderState(table)}
                onChange={table.getToggleAllRowsSelectedHandler()}
              />
            ),
            cell: ({ row }) => (
              <CheckboxField
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onCheckedChange={row.getToggleSelectedHandler()}
                size="sm"
              />
            ),
            size: 50,
            enableSorting: false,
          },
          {
            accessorKey: "word",
            header: "Word",
            cell: (props) => (
              <Button variant="plain" color="orange.400">
                {String(props.getValue())}
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
                  Positive -{props.getValue<KeywordItem["sentiment_distribution"]>()?.positive}
                </Text>
                <Text color="gray">
                  Neutral -{props.getValue<KeywordItem["sentiment_distribution"]>()?.neutral}
                </Text>
                <Text color="red">
                  Negative -{props.getValue<KeywordItem["sentiment_distribution"]>()?.negative}
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

const ToolBar = ({ table }: KeywordTableControlProps) => {
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

const KeywordFilters = ({ table }: KeywordTableControlProps) => {
  return (
    <KeywordBaseFilters table={table}>
      <RangeFilter fieldName="frequency" table={table} />
    </KeywordBaseFilters>
  );
};

const ReportWord = ({ row }: KeywordReportCellProps) => {
  const { word, reported } = row.original;

  const authState = useSelector((state: RootState) => state.authState);

  const { mutate, isPending } = useMutation({
    mutationFn: sendingData,
    onSuccess: invalidateKeywordQueries,
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
      headers: createAuthHeaders(authState.token),
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
