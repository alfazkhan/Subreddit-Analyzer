import { Table } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http";
import LoadingAndError from "@/components/ui-components/LoadingAndError";
import DataTable from "@/components/ui-components/Data Table/DataTable";

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
  });

  if (isError || isPending || isLoading) {
    return <LoadingAndError isError={isError} error={error} />;
  }

  return (
    <DataTable
      data={subreddits}
      tableHeaders={[
        "ID",
        "Name",
        "Description",
        "Total Users",
        "Active",
        "Updated",
        "Last Scanned",
      ]}
    >
      {(subreddits) =>
        subreddits.map((subreddit) => {
          if(!subreddit.is_active){
            return null
          }
          return (
            <Table.Row key={subreddit.id} textAlign="center">
              <Table.Cell>{subreddit.id}</Table.Cell>
              <Table.Cell>{subreddit.name}</Table.Cell>
              <Table.Cell>{subreddit.description}</Table.Cell>
              <Table.Cell>{subreddit.total_users}</Table.Cell>
              <Table.Cell>{subreddit.is_active ? "Yes" : "No"}</Table.Cell>
              <Table.Cell>{subreddit.keep_updated ? "Yes" : "No"}</Table.Cell>
              <Table.Cell>{subreddit.last_scanned}</Table.Cell>
            </Table.Row>
          );
        })
      }
    </DataTable>
  );
}
