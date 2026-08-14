import { Table } from "@chakra-ui/react";
import DataPagination from "../DataPagination";
import { useState } from "react";
import paginationDataSlicer from "@/util/paginationDataSlicer";

export default function DataTable({ data, tableHeaders, pageSize = 20, children }) {
  const [currentPage, setCurrentPage] = useState(1);

  const dataSlice = paginationDataSlicer(data, currentPage, pageSize);

  return (
    <>
      <Table.Root
        // colorPalette="gr"
        variant="outline"
        // showColumnBorder
        stickyHeader
        css={{ "& td": { textAlign: "center", color: "colorPalette.100" } }}
      >
        <Table.Caption />
        <Table.Header>
          <Table.Row>
            {tableHeaders.map((header) => {
              if (!header) {
                return;
              }
              return (
                <Table.ColumnHeader
                  color="orange.600"
                  fontWeight="extrabold"
                  key={header}
                  textAlign="center"
                >
                  {header}
                </Table.ColumnHeader>
              );
            })}
          </Table.Row>
        </Table.Header>
        <Table.Body>{children(dataSlice)}</Table.Body>
      </Table.Root>
      <DataPagination
        totalItems={data.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </>
  );
}

DataTable.Row = Table.Row;
DataTable.Cell = Table.Cell;
