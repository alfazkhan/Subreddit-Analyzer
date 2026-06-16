import { Table } from "@chakra-ui/react";

export default function DataTable({ tableHeaders, children }) {
  return (
    <>
      <Table.Root
        colorPalette="orange"
        variant="outline"
        // showColumnBorder
        stickyHeader
        css={{ "& td": { textAlign: "center" } }}
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
        <Table.Body>{children}</Table.Body>
      </Table.Root>
    </>
  );
}
