import { useEffect, useState } from "react";
// import { BASE_URL } from "../../../Constants.js";
import {
  Table,
  Switch,
  Checkbox,
  Checkmark,
  Badge,
  Button,
} from "@chakra-ui/react";
import DataPagination from "@/components/ui-components/DataPagination.jsx";
import DataTable from "@/components/ui-components/DataTable.jsx";
import EditableInput from "@/components/ui-components/EditableInput.jsx";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http.js";
import LoadingAndError from "@/components/ui-components/LoadingAndError.jsx";
import ApproveWord from "./ApproveWord";

export default function IgnoredWordsSection() {
  const [dataSlice, setdataSlice] = useState([]);

  const authState = useSelector((state) => state.authState);

  const {
    data: words,
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["ignored-words"],
    queryFn: ({ signal }) =>
      fetchingData({
        endpoint: "ignored-words",
        signal,
        headers: { Authorization: `Bearer ${authState.token}` },
      }),
  });
  

  if (isError || isPending || isLoading) {
    return (
      <LoadingAndError isLoading={isLoading} isError={isError} error={error} />
    );
  }


  async function ignoredWordApprovalHandler(word, payload) {
    // console.log(action, word, payload);
    // setLoading(true);
    // const update = JSON.stringify({
    //   approved: payload,
    // });

    // try {
    //   const response = await fetch(`${BASE_URL}/ignored-words/${word.word}`, {
    //     method: "PUT",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${authToken}`,
    //     },
    //     body: update,
    //   });
    //   const res = await response.json();
    //   const updatedWords = [...words];
    //   const wordIndex = updatedWords.findIndex((w) => w.id === word.id);
    //   updatedWords[wordIndex].approved = payload;
    //   setWords(updatedWords);
    //   setLoading(false)
    //   console.log(res);
    // } catch (error) {
    //   console.log(error);
    // }
  }

  return (
    <>
      <DataTable
        data={words}
        tableHeaders={["ID", "Word", "Language", "Processed", "Approved",""]}
      >
        {dataSlice.map((word) => (
          <Table.Row key={word.id} textAlign="center">
            <Table.Cell>{word.id}</Table.Cell>
            <Table.Cell>{word.word}</Table.Cell>
            <Table.Cell>
              {word.language}
            </Table.Cell>
            <Table.Cell textAlign="center">
              <Badge
                variant="subtle"
                colorPalette={word.processed ? "green" : "gray"}
              >
                {word.processed ? "Processed" : "Not Processed"}
              </Badge>
            </Table.Cell>
            <Table.Cell textAlign="center">
              <ApproveWord word={word}/>
            </Table.Cell>
          </Table.Row>
        ))}
      </DataTable>
      <DataPagination data={words} setPaginationData={setdataSlice} />
    </>
  );
}
