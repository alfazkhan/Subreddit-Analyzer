import { Badge, Text, NativeSelect, HStack, Input } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";
import {
  TextSearch,
  ValueSearch,
} from "@/components/ui-components/Data Table/Filters";

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
            return value.includes(filterValue.toLowerCase());
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

  return (
    <HStack>
      <TextSearch
        table={table}
        fieldName={"name"}
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
};
