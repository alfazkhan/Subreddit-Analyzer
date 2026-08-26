import { Badge, Text, NativeSelect, HStack, Input } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";

export default function SubredditsSection() {
  const {
    data: subreddits,
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["subreddits"],
    queryFn: ({ signal }) => fetchingData({ endpoint: "subreddits", signal }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  if (isError || isPending || isLoading) {
    return <LoadingAndError isError={isError} error={error} />;
  }

  return (
    <TanStackDataTable
      data={subreddits}
      TableFiltersComponent={TableFilters}
      tableColumns={[
        {
          accessorKey: "id",
          header: "ID",
          cell: (props) => (
            <Text textStyle="2xs" color="gray.600">
              {props.getValue()}
            </Text>
          ),
          size: 50,
        },
        {
          accessorKey: "name",
          header: "Name",
          cell: (props) => props.getValue(),
          filterFn: (row, columnID, filterValue) => {
            if (filterValue.length < 3) {
              return true;
            }
            const value = row.getValue(columnID).toLowerCase();
            return value.includes(filterValue.toLowerCase())
          },
        },
        {
          accessorKey: "description",
          header: "Description",
          cell: (props) => props.getValue(),
        },
        {
          accessorKey: "total_users",
          header: "Total Users",
          cell: (props) => props.getValue(),
        },
        {
          accessorKey: "is_active",
          header: "Active",
          cell: (props) => (
            <Badge
              variant="solid"
              colorPalette={props.getValue() ? "green" : "gray"}
            >
              {props.getValue() ? "Active" : "Not Active"}
            </Badge>
          ),
          filterFn: "equals",
        },
        {
          accessorKey: "keep_updated",
          header: "Updated",
          cell: (props) => (
            <Badge
              variant="solid"
              colorPalette={props.getValue() ? "blue" : "gray"}
            >
              {props.getValue() ? "Updated" : "Not Updated"}
            </Badge>
          ),
          filterFn: "equals",
        },
        {
          accessorKey: "last_scanned",
          header: "Last Scanned",
          cell: (props) => props.getValue(),
        },
      ]}
    />
  );
}

const TableFilters = ({ table }) => {
  const nameColumn = table.getColumn("name");
  const isActiveColumn = table.getColumn("is_active");
  const isUpdatedColumn = table.getColumn("keep_updated");


  return (
    <HStack>
      <Input
        size="2xs"
        placeholder="Subreddit Name..."
        variant="outline"
        onChange={(e) => nameColumn?.setFilterValue(e.target.value)}
      />
      <NativeSelect.Root size="xs">
        <NativeSelect.Field
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              isActiveColumn?.setFilterValue(undefined);
            } else {
              isActiveColumn?.setFilterValue(val === "true");
            }
          }}
        >
          <option value="">Subreddit Active</option>
          <option value="true">Active</option>
          <option value="false">Not Active</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <NativeSelect.Root size="xs">
        <NativeSelect.Field
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              isUpdatedColumn?.setFilterValue(undefined);
            } else {
              isUpdatedColumn?.setFilterValue(val === "true");
            }
          }}
        >
          <option value="">Subreddit Updated</option>
          <option value="true">Updated</option>
          <option value="false">Not Updated</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </HStack>
  );
};
