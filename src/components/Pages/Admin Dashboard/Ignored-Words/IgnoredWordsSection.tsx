import { Text } from "@chakra-ui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { createAuthHeaders, fetchingData } from "@/util/api";
import { LoadingAndError, StatusBadge } from "@/components/ui-components/Feedback";
import ApproveWord from "./ApproveWord";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import { KeywordBaseFilters } from "@/components/ui-components/Data Table/Filters";
import type {
  IgnoredWord,
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
    cell: ({ getValue }) => (
      <StatusBadge
        active={Boolean(getValue())}
        trueLabel="Processed"
        falseLabel="Not Processed"
        variant="subtle"
      />
    ),
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
        headers: createAuthHeaders(token, false),
      }),
  });

  if (isError || isPending || isLoading) {
    return (
      <LoadingAndError isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <TanStackDataTable
      data={words ?? []}
      TableFiltersComponent={KeywordBaseFilters}
      tableColumns={tableColumns}
      pageSize={10}
    />
  );
}
