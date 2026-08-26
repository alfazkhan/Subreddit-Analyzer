import { Badge, Text } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { fetchingData } from "@/util/http.js";
import LoadingAndError from "@/components/ui-components/LoadingAndError.jsx";
import ApproveWord from "./ApproveWord";
import DataTable from "@/components/ui-components/Data Table/DataTable";
import TanStackDataTable from "@/components/ui-components/Data Table/TanstackDataTable";

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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  if (isError || isPending || isLoading) {
    return (
      <LoadingAndError isLoading={isLoading} isError={isError} error={error} />
    );
  }

  return (
    <>
      <TanStackDataTable
        data={words}
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
            accessorKey: "word",
            header: "Word",
            cell: (props) => props.getValue(),
          },
          {
            accessorKey: "language",
            header: "Language",
            cell: (props) => props.getValue(),
          },
          {
            accessorKey: "processed",
            header: "Processed",
            cell: (props) => (
              <Badge
                variant="subtle"
                colorPalette={props.getValue() ? "green" : "gray"}
              >
                {props.getValue() ? "Processed" : "Not Processed"}
              </Badge>
            ),
          },
          {
            accessorKey: "approved",
            header: "Approved",
            cell: ApproveWord,
          },
        ]}
        pageSize={10}
      />
      <DataTable
        data={words}
        tableHeaders={["Words", "Language", "Processed", "Approved"]}
        display="none"
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
    </>
  );
}
