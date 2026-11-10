import { Table } from "@chakra-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { paginationDataSlicer } from "@/util/data";

type DataTableProps<TData> = {
  data: TData[];
  tableHeaders: (string | null | undefined)[];
  pageSize?: number;
  children: ReactNode | ((dataSlice: TData[]) => ReactNode);
} & Omit<ComponentProps<typeof Table.Root>, "children">;

const DataTable = Object.assign(
  function DataTable<TData>({
    data,
    tableHeaders,
    pageSize = 20,
    children,
    ...props
  }: DataTableProps<TData>) {
    const dataSlice = paginationDataSlicer(data, 1, pageSize) ?? [];

    return (
      <Table.Root
        variant="outline"
        stickyHeader
        css={{ "& td": { textAlign: "center", color: "colorPalette.100" } }}
        {...props}
      >
        <Table.Caption />
        <Table.Header>
          <Table.Row>
            {tableHeaders.map((header) =>
              header ? (
                <Table.ColumnHeader
                  color="orange.600"
                  fontWeight="extrabold"
                  key={header}
                  textAlign="center"
                >
                  {header}
                </Table.ColumnHeader>
              ) : null,
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {typeof children === "function" ? children(dataSlice) : children}
        </Table.Body>
      </Table.Root>
    );
  },
  { Row: Table.Row, Cell: Table.Cell },
);

export default DataTable;
