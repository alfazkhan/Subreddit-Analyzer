import { useEffect, useState } from "react";
import { BASE_URL } from "../../../Constants.js";
import { Table } from "@chakra-ui/react";
import paginatedDataSlicer from "../../../util/paginationDataSlicer.js";
import DataPagination from "@/components/ui-components/DataPagination.jsx";
import DataTable from "@/components/ui-components/DataTable.jsx";

export default function IgnoredWordsSection() {
  const [words, setWords] = useState([]);
  const [dataSlice, setdataSlice] = useState([])


  useEffect(() => {
    async function fetchIgnoredWords() {
      const response = await fetch(BASE_URL + "/ignored-words");
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Something went wrong!");
      } else {
        setWords(resData);
      }
    }

    fetchIgnoredWords();
  }, []);



  return (
    <>
      <DataTable
        data={words}
        tableHeaders={["ID", "Word", "Language", "Processed", "Approved"]}
      >
        {dataSlice.map((word) => (
          <Table.Row key={word.id}>
            <Table.Cell>{word.id}</Table.Cell>
            <Table.Cell>{word.word}</Table.Cell>
            <Table.Cell>{word.language}</Table.Cell>
            <Table.Cell>{word.processed ? "Yes" : "No"}</Table.Cell>
            <Table.Cell>{word.approved ? "Yes" : "No"}</Table.Cell>
          </Table.Row>
        ))}
      </DataTable>
      <DataPagination
        data={words}
        setPaginationData = {setdataSlice}
      />
    </>
  );
}
