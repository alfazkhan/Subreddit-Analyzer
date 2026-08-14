import { Badge } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http.js";
import LoadingAndError from "@/components/ui-components/LoadingAndError.jsx";
import ApproveWord from "./ApproveWord";
import DataTable from "@/components/ui-components/Data Table/DataTable";

export default function IgnoredWordsSection() {
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



  return (
    <DataTable
      data={words}
      tableHeaders={["Words", "Language", "Processed", "Approved"]}
    >
      {(slicedData) =>
        slicedData.map((word) => (
          <DataTable.Row key={word.id}>
            <DataTable.Cell>{word.word}</DataTable.Cell>
            <DataTable.Cell>{word.language}</DataTable.Cell>
            <DataTable.Cell textAlign="center">
              <Badge
                variant="subtle"
                colorPalette={word.processed ? "green" : "gray"}
              >
                {word.processed ? "Processed" : "Not Processed"}
              </Badge>
            </DataTable.Cell>
            <DataTable.Cell textAlign="center">
              <ApproveWord word={word} />
            </DataTable.Cell>
          </DataTable.Row>
        ))
      }
    </DataTable>
  );
}
