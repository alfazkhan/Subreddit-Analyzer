import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import {
  Table,
  Box,
  Pagination,
  ButtonGroup,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FaArrowDown, FaArrowUp, FaMinus } from "react-icons/fa";

export default function TanStackDataTable({
  data,
  tableColumns,
  pageSize = 10,
  TableFiltersComponent = () => <></>,
  TableToolbarComponent = () => <></>,
  manualPagination = false,
  ...props
}) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data: data,
    state: {
      pagination,
    },
    initialState: {
      columnFilters: [],
    },
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    ...props,
  });

  return (
    <Stack>
      <TableFiltersComponent table={table} />
      <TableToolbarComponent table={table} />
      <Table.Root
        variant="outline"
        stickyHeader
        css={{ "& td": { textAlign: "center", color: "colorPalette.100" } }}
        tableLayout="fixed"
        width={`${table.getTotalSize()}px`}
        minWidth="100%"
        showColumnBorder
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
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <div>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </div>
                    {header.column.getCanSort() && (
                      <Text
                        as="button"
                        size="2xs"
                        fontSize="2xs"
                        padding="0.5"
                        rounded="full"
                        bgColor="gray.200"
                        color="orange.600"
                        justifySelf="end"
                        onClick={() => {
                          header.column.toggleSorting(
                            header.column.getIsSorted() === "asc",
                          );
                        }}
                        marginLeft={2}
                      >
                        {!header.column.getIsSorted() && <FaMinus />}
                        {header.column.getIsSorted() === "asc" && <FaArrowUp />}
                        {header.column.getIsSorted() === "desc" && (
                          <FaArrowDown />
                        )}
                      </Text>
                    )}
                  </Box>
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
                <Table.Cell
                  key={cell.id}
                  backgroundColor={
                    row.getIsSelected()
                      ? "rgba(255, 255, 255, 0.1);"
                      : "transparent"
                  }
                >
                  <div>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {!manualPagination && (
        <TablePagination table={table} setPagination={setPagination} />
      )}
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
