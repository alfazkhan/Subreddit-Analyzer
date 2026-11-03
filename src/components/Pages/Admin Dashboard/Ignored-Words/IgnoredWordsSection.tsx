import { Badge, Text, VStack } from "@chakra-ui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { fetchingData } from "@/util/http";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import ApproveWord from "./ApproveWord";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import {
  TextSearch,
  ValueSearch,
} from "@/components/ui-components/Data Table/Filters";
import type {
  IgnoredWord,
  IgnoredWordsTableFiltersProps,
  RootState,
} from "@/util/Types";

const tableColumns: ColumnDef<IgnoredWord>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ getValue }) => (
      <Text textStyle="2xs" color="gray.600">
        {String(getValue())}
      </Text>
    ),
    size: 50,
  },
  {
    accessorKey: "word",
    header: "Word",
    cell: ({ getValue }) => String(getValue() ?? ""),
    filterFn: "includesString",
  },
  {
    accessorKey: "language",
    header: "Language",
    cell: ({ getValue }) => String(getValue() ?? ""),
  },
  {
    accessorKey: "processed",
    header: "Processed",
    cell: ({ getValue }) => {
      const isProcessed = Boolean(getValue());
      return (
        <Badge
          variant="subtle"
          colorPalette={isProcessed ? "green" : "gray"}
        >
          {isProcessed ? "Processed" : "Not Processed"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "approved",
    header: "Approved",
    cell: ApproveWord,
  },
];

export default function IgnoredWordsSection() {
  const token = useSelector((state: RootState) => state.authState.token);
  const {
    data: words,
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery<IgnoredWord[]>({
    queryKey: ["ignored-words"],
    queryFn: ({ signal }) =>
      fetchingData({
        endpoint: "ignored-words",
        signal,
        headers: { Authorization: `Bearer ${token}` },
      }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  if (isError || isPending || isLoading) {
    return (
      <LoadingAndError isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <TanStackDataTable
      data={words ?? []}
      TableFiltersComponent={KeywordFilters}
      tableColumns={tableColumns}
      pageSize={10}
    />
  );
}

function KeywordFilters({ table }: IgnoredWordsTableFiltersProps = {}) {
  if (!table) return <></>;

  return (
    <VStack>
      <TextSearch
        fieldName="word"
        placeholder="Search Keyword..."
        table={table}
      />
      <ValueSearch
        table={table}
        fieldName="reported"
        options={[
          { value: "true", text: "All" },
          { value: "false", text: "Hide Reported Word" },
        ]}
      />
    </VStack>
  );
}
