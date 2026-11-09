import { HStack, Input, NativeSelect, Slider } from "@chakra-ui/react";
import type { ComponentProps } from "react";
import type { RowData, Table } from "@tanstack/react-table";

type TextSearchProps<TData extends RowData> = {
  table: Table<TData>;
  fieldName: string;
  placeholder?: string;
} & ComponentProps<typeof Input>;

type ValueSearchProps<TData extends RowData> = {
  table: Table<TData>;
  fieldName: string;
  options: { value: string; text: string }[];
} & ComponentProps<typeof NativeSelect.Root>;

type RangeFilterProps<TData extends { frequency?: unknown }> = {
  table: Table<TData>;
  fieldName: string;
} & ComponentProps<typeof Slider.Root>;

export function TextSearch<TData extends RowData>({
  table,
  fieldName,
  placeholder,
  ...props
}: TextSearchProps<TData>) {
  const columnName = table.getColumn(fieldName);
  return (
    <Input
      size="2xs"
      placeholder={placeholder}
      variant="outline"
      onChange={(e) => columnName?.setFilterValue(e.target.value)}
      style={{ color: "#fff" }}
      _placeholder={{ color: "#fff" }}
      {...props}
    />
  );
}

export function ValueSearch<TData extends RowData>({
  table,
  fieldName,
  options,
  ...props
}: ValueSearchProps<TData>) {
  const columnName = table.getColumn(fieldName);
  const booleanFilter = options
    .filter(({ value }) => value !== "")
    .every(({ value }) => value === "true" || value === "false");

  return (
    <NativeSelect.Root size="xs" {...props}>
      <NativeSelect.Field
        defaultValue={
          options.some(({ value }) => value === "") ? "" : undefined
        }
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") {
            columnName?.setFilterValue(undefined);
          } else if (booleanFilter) {
            columnName?.setFilterValue(val === "true");
          } else {
            columnName?.setFilterValue(val);
          }
        }}
      >
        {options.map((o) => (
          <option key={o.text} value={o.value} style={{ color: "#000" }}>
            {o.text}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}

function findMinMax(keywords: readonly { frequency?: unknown }[] | undefined) {
  if (!keywords || keywords.length === 0) {
    return [0, 100];
  }

  let min = Infinity;
  let max = 0;

  keywords.forEach((word) => {
    const freq = Number(word.frequency) || 0;
    if (freq < min) min = freq;
    if (freq > max) max = freq;
  });

  if (min === max) {
    return [0, max || 100];
  }

  return [min, max];
}

export function RangeFilter<TData extends { frequency?: unknown }>({
  table,
  fieldName,
  ...props
}: RangeFilterProps<TData>) {
  const columnName = table.getColumn(fieldName);
  const filterValue = columnName?.getFilterValue() as number[] | undefined;
  const range = findMinMax(table.options.data);
  return (
    <Slider.Root
      //   value={filterValue[0] ?? ''}
      min={range[0]}
      max={range[1]}
      defaultValue={range}
      onValueChangeEnd={(e) => columnName?.setFilterValue(e.value)}
      colorPalette="orange"
      size="lg"
      width="full"
      {...props}
    >
      <HStack display="flex" justifyContent="space-between">
        <Slider.ValueText>{filterValue?.[0]}</Slider.ValueText>
        <Slider.ValueText>Keyword Count Range</Slider.ValueText>
        <Slider.ValueText>{filterValue?.[1]}</Slider.ValueText>
      </HStack>
      <Slider.Control>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb index={0} />
        <Slider.Thumb index={1} />
      </Slider.Control>
    </Slider.Root>
  );
}
