import { useState } from "react";
import type { ComponentType } from "react";
import {
  type ColumnDef,
  type Header,
  type RowData,
  type Table as ReactTable,
  type TableOptions,
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  Box,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FaArrowDown, FaArrowUp, FaMinus } from "react-icons/fa";
import DataPagination from "./DataPagination";

type TableComponentProps<TData extends RowData> = {
  table: ReactTable<TData>;
};

type TanStackDataTableProps<TData extends RowData> = {
  data: TData[];
  tableColumns: ColumnDef<TData, unknown>[];
  pageSize?: number;
  TableFiltersComponent?: ComponentType<TableComponentProps<TData>>;
  TableToolbarComponent?: ComponentType<TableComponentProps<TData>>;
  manualPagination?: boolean;
} & Omit<
  Partial<TableOptions<TData>>,
  | "data"
  | "columns"
  | "state"
  | "initialState"
  | "getCoreRowModel"
  | "getPaginationRowModel"
  | "getFilteredRowModel"
  | "getSortedRowModel"
  | "columnResizeMode"
>;

export default function TanStackDataTable<TData extends RowData>({
  data,
  tableColumns,
  pageSize = 10,
  TableFiltersComponent = () => <></>,
  TableToolbarComponent = () => <></>,
  manualPagination = false,
  ...props
}: TanStackDataTableProps<TData>) {
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
        <DataPagination
          totalItems={table.getRowCount()}
          pageSize={table.getState().pagination.pageSize}
          currentPage={table.getState().pagination.pageIndex + 1}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))
          }
          hideWhenSinglePage={false}
        />
      )}
    </Stack>
  );
}

const RESIZER_HANDLES = [
  { right: 0, hideWhenIdle: true },
  { right: -1, hideWhenIdle: false },
] as const;

function Resizer<TData extends RowData, TValue>({
  header,
}: {
  header: Header<TData, TValue>;
}) {
  if (!header.column.getCanResize()) {
    return <div />;
  }

  const isResizing = header.column.getIsResizing();

  return (
    <div>
      {RESIZER_HANDLES.map(({ right, hideWhenIdle }) => (
        <Box
          key={right}
          as="div"
          position="absolute"
          right={right}
          top="50%"
          transform="translateY(-50%)"
          height="20px"
          width={isResizing ? "4px" : "10px"}
          background={isResizing ? "orange.600" : "gray.500"}
          display={hideWhenIdle && !isResizing ? "none" : "block"}
          borderRadius={5}
          cursor="col-resize"
          userSelect="none"
          touchAction="none"
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={`resizer ${isResizing ? "isResizing" : ""}`}
        />
      ))}
    </div>
  );
}
