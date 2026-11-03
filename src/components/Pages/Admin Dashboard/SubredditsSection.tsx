import { Badge, HStack, Checkbox } from "@chakra-ui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
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
    header: ({ table }) => {
      const checked = table.getIsAllRowsSelected()
        ? true
        : table.getIsSomeRowsSelected()
          ? "indeterminate"
          : false;
      return (
        <Checkbox.Root
          checked={checked}
          onCheckedChange={(details) =>
            table.toggleAllRowsSelected(details.checked === true)
          }
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      );
    },
    cell: ({ row, getValue }) => (
      <Checkbox.Root
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(details) =>
          row.toggleSelected(details.checked === true)
        }
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        {String(getValue())}
      </Checkbox.Root>
    ),
    size: 50,
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue }) => String(getValue() ?? ""),
    filterFn: (row, columnID, filterValue) => {
      const value = row.getValue<string>(columnID);
      const query = String(filterValue ?? "");
      return query.length < 3 || value.toLowerCase().includes(query.toLowerCase());
    },
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
    cell: ({ getValue }) => {
      const isActive = Boolean(getValue());
      return (
        <Badge variant="solid" colorPalette={isActive ? "green" : "gray"}>
          {isActive ? "Active" : "Not Active"}
        </Badge>
      );
    },
    filterFn: "equals",
  },
  {
    accessorKey: "keep_updated",
    header: "Updated",
    cell: ({ getValue }) => {
      const isUpdated = Boolean(getValue());
      return (
        <Badge variant="solid" colorPalette={isUpdated ? "blue" : "gray"}>
          {isUpdated ? "Updated" : "Not Updated"}
        </Badge>
      );
    },
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
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
