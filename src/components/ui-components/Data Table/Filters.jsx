import { HStack, Input, NativeSelect, Slider } from "@chakra-ui/react";

export function TextSearch({ table, fieldName, placeholder, ...props }) {
  const columnName = table.getColumn(fieldName);
  return (
    <Input
      size="2xs"
      placeholder={placeholder}
      variant="outline"
      onChange={(e) => columnName?.setFilterValue(e.target.value)}
      {...props}
    />
  );
}

export function ValueSearch({ table, fieldName, options, ...props }) {
  const columnName = table.getColumn(fieldName);
  return (
    <NativeSelect.Root size="xs" {...props}>
      <NativeSelect.Field
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") {
            columnName?.setFilterValue(undefined);
          } else {
            columnName?.setFilterValue(val === "true");
          }
        }}
      >
        {options.map((o) => (
          <option key={o.text} value={o.value}>
            {o.text}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}

function findMinMax(keywords) {
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

export function RangeFilter({ table, fieldName, ...props }) {
  const columnName = table.getColumn(fieldName);
  const filterValue = columnName.getFilterValue() || [];
  const range = findMinMax(table.options.data) || [10, 1000];
  return (
    <Slider.Root
      //   value={filterValue[0] ?? ''}
      min={range[0]}
      max={range[1]}
      defaultValue={range}
      onValueChangeEnd={(e) => columnName.setFilterValue(e.value)}
      colorPalette="orange"
      size="lg"
      width="full"
      {...props}
    >
      <HStack display="flex" justifyContent="space-between">
        <Slider.ValueText>{filterValue[0]}</Slider.ValueText>
        <Slider.ValueText>Keyword Count Range</Slider.ValueText>
        <Slider.ValueText>{filterValue[1]}</Slider.ValueText>
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
