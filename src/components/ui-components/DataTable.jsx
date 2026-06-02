import { Table } from "@chakra-ui/react";

export default function DataTable({ tableHeaders, children }) {

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
            {tableHeaders.map((header)=>(
            <Table.ColumnHeader color="orange.600" fontWeight="extrabold" key={header}>
              {header}
            </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {children}
        </Table.Body>
      </Table.Root>

    </>
  );
}
