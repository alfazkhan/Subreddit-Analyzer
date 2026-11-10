import { HStack } from "@chakra-ui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/api";
import { createMinLengthFilterFn } from "@/util/data";
import { LoadingAndError, StatusBadge } from "@/components/ui-components/Feedback";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import {
  CheckboxField,
  getSelectionHeaderState,
} from "@/components/ui-components/FormControls";
import {
  TextSearch,
  ValueSearch,
} from "@/components/ui-components/Data Table/Filters";
import type {
  AdminSubreddit,
  SubredditsTableFiltersProps,
} from "@/util/Types";

const tableColumns: ColumnDef<AdminSubreddit>[] = [
  {
    accessorKey: "id",
    header: ({ table }) => (
      <CheckboxField
        checked={getSelectionHeaderState(table)}
        onCheckedChange={(details) =>
          table.toggleAllRowsSelected(details.checked === true)
        }
      />
    ),
    cell: ({ row, getValue }) => (
      <CheckboxField
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(details) =>
          row.toggleSelected(details.checked === true)
        }
      >
        {String(getValue())}
      </CheckboxField>
    ),
    size: 50,
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue }) => String(getValue() ?? ""),
    filterFn: createMinLengthFilterFn<AdminSubreddit>(3),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ getValue }) => String(getValue() ?? ""),
  },
  {
    accessorKey: "total_users",
    header: "Total Users",
    cell: ({ getValue }) => String(getValue() ?? ""),
  },
  {
    accessorKey: "is_active",
    header: "Active",
    cell: ({ getValue }) => (
      <StatusBadge
        active={Boolean(getValue())}
        trueLabel="Active"
        falseLabel="Not Active"
        trueColorPalette="green"
      />
    ),
    filterFn: "equals",
  },
  {
    accessorKey: "keep_updated",
    header: "Updated",
    cell: ({ getValue }) => (
      <StatusBadge
        active={Boolean(getValue())}
        trueLabel="Updated"
        falseLabel="Not Updated"
        trueColorPalette="blue"
      />
    ),
    filterFn: "equals",
  },
  {
    accessorKey: "last_scanned",
    header: "Last Scanned",
    cell: ({ getValue }) => String(getValue() ?? ""),
  },
];

export default function SubredditsSection() {
  const {
    data: subreddits,
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery<AdminSubreddit[]>({
    queryKey: ["subreddits"],
    queryFn: ({ signal }) =>
      fetchingData({ endpoint: "subreddits", signal, headers: {} }),
  });

  if (isError || isPending || isLoading) {
    return <LoadingAndError isError={isError} isLoading={isLoading} error={error} />;
  }

  return (
    <TanStackDataTable
      data={subreddits ?? []}
      TableFiltersComponent={TableFilters}
      getRowId={(row: AdminSubreddit) => String(row.id)}
      tableColumns={tableColumns}
    />
  );
}

function TableFilters({ table }: SubredditsTableFiltersProps = {}) {
  if (!table) return <></>;

  return (
    <HStack>
      <TextSearch
        table={table}
        fieldName="name"
        placeholder="Subreddit Name..."
      />
      <ValueSearch
        table={table}
        fieldName="is_active"
        options={[
          { value: "", text: "All" },
          { value: "true", text: "Active" },
          { value: "false", text: "Not Active" },
        ]}
      />
      <ValueSearch
        table={table}
        fieldName="keep_updated"
        options={[
          { value: "", text: "All" },
          { value: "true", text: "Updated" },
          { value: "false", text: "Not Updated" },
        ]}
      />
    </HStack>
  );
}
