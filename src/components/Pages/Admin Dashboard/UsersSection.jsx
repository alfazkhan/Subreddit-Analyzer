import DataPagination from "@/components/ui-components/DataPagination";
import DataTable from "@/components/ui-components/DataTable";
import { BASE_URL } from "@/Constants";
import { useEffect, useState } from "react";
import { Table } from "@chakra-ui/react";
import { useSelector } from "react-redux";

export default function UsersSection() {
  const [subreddits, setSubreddits] = useState([]);
  const [dataSlice, setdataSlice] = useState([]);
    const authToken = useSelector((state) => state.authState.token);

  useEffect(() => {
    async function fetchIgnoredWords() {
      const response = await fetch(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Something went wrong!");
      } else {
        console.log("USERS:", resData);
        // setSubreddits(resData);
      }
    }

    fetchIgnoredWords();
  }, []);

  return (
    <>
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
        {dataSlice.map((subreddit) => (
          <Table.Row key={subreddit.id} textAlign="center">
            <Table.Cell>{subreddit.id}</Table.Cell>
            <Table.Cell>{subreddit.name}</Table.Cell>
            <Table.Cell>{subreddit.description}</Table.Cell>
            <Table.Cell>{subreddit.total_users}</Table.Cell>
            <Table.Cell>{subreddit.is_active ? "Yes" : "No"}</Table.Cell>
            <Table.Cell>{subreddit.keep_updated ? "Yes" : "No"}</Table.Cell>
            <Table.Cell>{subreddit.last_scanned}</Table.Cell>
          </Table.Row>
        ))}
      </DataTable>
      <DataPagination data={subreddits} setPaginationData={setdataSlice} />
    </>
  );
}
