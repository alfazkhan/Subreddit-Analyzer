import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import {
  Table,
  Box,
  Pagination,
  ButtonGroup,
  IconButton,
  Stack,
} from "@chakra-ui/react";

export default function TanStackDataTable({
  data,
  tableColumns,
  pageSize = 10,
  TableFiltersComponent = () => <></>,
  ...props
}) {
  const sortedData = data.sort((a, b) => b.id - a.id);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data: sortedData,
    state: {
      pagination,
    },
    initialState: {
      columnFilters: [],
    },
    columns: tableColumns,
    meta: {
      add: (a, b) => a + b,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: "onChange",
  });

  return (
    <Stack>
      <TableFiltersComponent table={table} />
      <Table.Root
        variant="outline"
        stickyHeader
        css={{ "& td": { textAlign: "center", color: "colorPalette.100" } }}
        tableLayout="fixed"
        width={`${table.getTotalSize()}px`}
        minWidth="100%"
        showColumnBorder
        {...props}
      >
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.ColumnHeader
                  key={header.id}
                  color="orange.600"
                  fontWeight="extrabold"
                  textAlign="center"
                  position="relative"
                  width={`${header.getSize()}px`}
                >
                  <div>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </div>
                  <Resizer header={header} />
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id} textAlign="center">
              {row.getVisibleCells().map((cell) => (
                <Table.Cell key={cell.id}>
                  <div>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <TablePagination table={table} setPagination={setPagination} />
    </Stack>
  );
}

const TablePagination = ({ table, setPagination }) => {
  return (
    <>
      <Pagination.Root
        count={table.getRowCount()}
        pageSize={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex + 1}
        onPageChange={(e) => {
          setPagination((prev) => ({ ...prev, pageIndex: e.page - 1 }));
        }}
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
};

const Resizer = ({ header }) => {
  return (
    <div>
      {header.column.getCanResize() && (
        <Box
          as="div"
          position="absolute"
          right={0}
          top="50%"
          transform="translateY(-50%)"
          height={header.column.getIsResizing() ? "20px" : "20px"}
          width={header.column.getIsResizing() ? "4px" : "10px"}
          background={header.column.getIsResizing() ? "orange.600" : "gray.500"}
          display={header.column.getIsResizing() ? "block" : "none"}
          borderRadius={5}
          cursor="col-resize"
          userSelect="none"
          touchAction="none"
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={`resizer ${
            header.column.getIsResizing() ? "isResizing" : ""
          }`}
        />
      )}
      {header.column.getCanResize() && (
        <Box
          as="div"
          position="absolute"
          right={-1}
          top="50%"
          transform="translateY(-50%)"
          height={header.column.getIsResizing() ? "20px" : "20px"}
          width={header.column.getIsResizing() ? "4px" : "10px"}
          background={header.column.getIsResizing() ? "orange.600" : "gray.500"}
          borderRadius={5}
          cursor="col-resize"
          userSelect="none"
          touchAction="none"
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={`resizer ${
            header.column.getIsResizing() ? "isResizing" : ""
          }`}
        />
      )}
    </div>
  );
};
