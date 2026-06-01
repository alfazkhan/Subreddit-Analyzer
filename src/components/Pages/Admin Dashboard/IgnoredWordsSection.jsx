import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../../../Constants.js";
import { Table, Pagination, ButtonGroup, IconButton } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export default function IgnoredWordsSection() {
  const [words, setWords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10)


  useEffect(() => {
    async function fetchIgnoredWords() {
      const response = await fetch(BASE_URL + "/ignored-words");
      console.log(response);
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Something went wrong!");
      } else {
        setWords(resData);
        console.log(resData);
      }
    }

    fetchIgnoredWords();
  }, []);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return words.slice(start, end);
  }, [words, currentPage, pageSize]);

  return (
    <>
      <Table.Root
        colorPalette="orange"
        variant="outline"
        showColumnBorder
        stickyHeader
      >
        <Table.Caption />
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>ID</Table.ColumnHeader>
            <Table.ColumnHeader>Word</Table.ColumnHeader>
            <Table.ColumnHeader>Language</Table.ColumnHeader>
            <Table.ColumnHeader>Processed</Table.ColumnHeader>
            <Table.ColumnHeader>Approved</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {paginatedData.map((word) => (
            <Table.Row>
              <Table.Cell>{word.id}</Table.Cell>
              <Table.Cell>{word.word}</Table.Cell>
              <Table.Cell>{word.language}</Table.Cell>
              <Table.Cell>{word.processed ? "Yes" : "No"}</Table.Cell>
              <Table.Cell>{word.approved ? "Yes" : "No"}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Pagination.Root
        count={words.length}
        pageSize={pageSize}
        page={currentPage}
        onPageChange={(details) => setCurrentPage(details.page)}
      >
        <ButtonGroup variant="ghost" size="sm" wrap="wrap" mt={3}>
          <Pagination.PrevTrigger asChild color="gray.100">
            <IconButton>
              <LuChevronLeft />
            </IconButton>
          </Pagination.PrevTrigger>

          <Pagination.Items
            render={(page) => (
              <IconButton
                variant={{ base: "ghost", _selected: "outline" }}
                color="gray.100"
              >
                {page.value}
              </IconButton>
            )}
          />

          <Pagination.NextTrigger asChild color="gray.100">
            <IconButton>
              <LuChevronRight />
            </IconButton>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Pagination.Root>
    </>
  );
}
