import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import {
  Button,
  Checkbox,
  Editable,
  Flex,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { RowData, Table } from "@tanstack/react-table";
import { LuCheck, LuPencilLine, LuX } from "react-icons/lu";
import { getLocalISODate, parseTimezones } from "@/util/dateTime";
import type {
  DateSelectorProps,
  EditableInputProps,
  TimeZoneSelectProps,
} from "@/util/Types";

// ── CheckboxField ──────────────────────────────────────────────────

export type CheckboxFieldProps = Omit<ComponentProps<typeof Checkbox.Root>, "children"> & {
  children?: ReactNode;
  controlProps?: ComponentProps<typeof Checkbox.Control>;
  labelProps?: ComponentProps<typeof Checkbox.Label>;
};

/**
 * Computes the tri-state checked status for a TanStack Table header selection checkbox.
 */
export function getSelectionHeaderState<TData extends RowData>(
  table: Table<TData>,
): boolean | "indeterminate" {
  if (table.getIsAllRowsSelected()) return true;
  if (table.getIsSomeRowsSelected()) return "indeterminate";
  return false;
}

/**
 * Reusable Chakra Checkbox wrapper encapsulating HiddenInput, Control, and optional Label.
 */
export function CheckboxField({
  children,
  controlProps,
  labelProps,
  ...props
}: CheckboxFieldProps) {
  return (
    <Checkbox.Root {...props}>
      <Checkbox.HiddenInput />
      <Checkbox.Control {...controlProps} />
      {children !== undefined && children !== null && (
        <Checkbox.Label {...labelProps}>{children}</Checkbox.Label>
      )}
    </Checkbox.Root>
  );
}

// ── FilterChipRow ──────────────────────────────────────────────────

export interface FilterChipOption {
  value: string;
  label: string;
  emoji?: string;
}

export interface FilterChipRowProps {
  title: string;
  options: readonly FilterChipOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  overflowX?: "auto" | "scroll" | "hidden" | "visible";
  labelFontSize?: string;
}

/**
 * Horizontal row of selectable filter chips used for categorical filtering.
 */
export function FilterChipRow({
  title,
  options,
  selectedValue,
  onSelect,
  overflowX,
  labelFontSize,
}: FilterChipRowProps) {
  return (
    <HStack
      width="full"
      justifyContent="space-around"
      gap="4"
      mb={4}
      borderWidth="0.1px"
      padding={3}
      borderColor="gray.700"
      overflowX={overflowX}
    >
      <Text fontSize="lg" fontWeight="bold">
        {title}
      </Text>
      {options.map((option) => (
        <Flex
          key={option.value}
          alignItems="center"
          borderRadius="xs"
          padding={2}
          cursor="pointer"
          backgroundColor={
            option.value === selectedValue ? "orange.600" : "gray.800"
          }
          _hover={{ bg: "whiteAlpha.100" }}
          onClick={() => onSelect(option.value)}
        >
          {option.emoji && <Text>{option.emoji}</Text>}
          <Text fontSize={labelFontSize} fontWeight="bold" color="white">
            {option.label}
          </Text>
        </Flex>
      ))}
    </HStack>
  );
}

// ── DateSelector ───────────────────────────────────────────────────

const DATE_PRESETS = [
  { key: "last7Days", label: "Last 7 days" },
  { key: "last30Days", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "thisYear", label: "This year" },
  { key: "lastYear", label: "Last year" },
] as const;

export function DateSelector({ start, end, onChange }: DateSelectorProps) {
  const handlePreset = (preset: string) => {
    const today = new Date();
    const s = new Date();
    const e = new Date();

    switch (preset) {
      case "last7Days":
        s.setDate(today.getDate() - 7);
        break;
      case "last30Days":
        s.setDate(today.getDate() - 30);
        break;
      case "thisMonth":
        s.setDate(1);
        break;
      case "lastMonth":
        s.setMonth(today.getMonth() - 1);
        s.setDate(1);
        e.setMonth(today.getMonth());
        e.setDate(0); // Day 0 is automatically the last day of the previous month
        break;
      case "thisYear":
        s.setMonth(0);
        s.setDate(1);
        break;
      case "lastYear":
        s.setFullYear(today.getFullYear() - 1);
        s.setMonth(0);
        s.setDate(1);
        e.setFullYear(today.getFullYear() - 1);
        e.setMonth(11);
        e.setDate(31);
        break;
      default:
        return;
    }

    onChange(getLocalISODate(s), getLocalISODate(e));
  };

  const dateInputs = [
    {
      label: "Start Date",
      value: start,
      max: end || undefined,
      min: undefined,
      onValueChange: (nextValue: string) => onChange(nextValue, end),
    },
    {
      label: "End Date",
      value: end,
      min: start || undefined,
      max: undefined,
      onValueChange: (nextValue: string) => onChange(start, nextValue),
    },
  ];

  return (
    <VStack align="start" gap={3}>
      <Flex wrap="wrap" gap={2} maxWidth="300px">
        {DATE_PRESETS.map((preset) => (
          <Button
            key={preset.key}
            size="xs"
            variant="surface"
            onClick={() => handlePreset(preset.key)}
          >
            {preset.label}
          </Button>
        ))}
      </Flex>

      <HStack gap={4} alignItems="center">
        {dateInputs.map((input) => (
          <VStack key={input.label} align="start" gap={1}>
            <Text fontSize="xs" color="whiteAlpha.500">
              {input.label}
            </Text>
            <Input
              type="date"
              size="sm"
              value={input.value}
              min={input.min}
              max={input.max}
              onChange={(e) => input.onValueChange(e.target.value)}
              color="white"
              bg="whiteAlpha.100"
              borderColor="whiteAlpha.300"
            />
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
}

// ── EditableInput ──────────────────────────────────────────────────

export function EditableInput({ fieldValue }: EditableInputProps) {
  return (
    <Editable.Root value={fieldValue}>
      <Editable.Preview />
      <Editable.Input />
      <Editable.Control>
        <Editable.EditTrigger asChild>
          <IconButton variant="ghost" size="xs">
            <LuPencilLine />
          </IconButton>
        </Editable.EditTrigger>
        <Editable.CancelTrigger asChild>
          <IconButton variant="outline" size="xs">
            <LuX />
          </IconButton>
        </Editable.CancelTrigger>
        <Editable.SubmitTrigger asChild>
          <IconButton variant="outline" size="xs">
            <LuCheck />
          </IconButton>
        </Editable.SubmitTrigger>
      </Editable.Control>
    </Editable.Root>
  );
}

// ── TimeZoneSelect ─────────────────────────────────────────────────

// Compute static lookup dictionary outside the component lifecycle
const PARSED_TIMEZONES = parseTimezones();

export function TimeZoneSelect({ onTimeZoneChange, currentTimeZone }: TimeZoneSelectProps) {
  const [initialCountry, initialZone] = currentTimeZone && currentTimeZone.includes("/")
    ? currentTimeZone.split("/")
    : ["", ""];

  const [country, setCountry] = useState(initialCountry);
  const [zone, setZone] = useState(initialZone);

  useEffect(() => {
    if (currentTimeZone && currentTimeZone.includes("/")) {
      const [c, z] = currentTimeZone.split("/");
      setCountry(c);
      setZone(z);
    }
  }, [currentTimeZone]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCountry = e.currentTarget.value;
    setCountry(nextCountry);
    setZone("");
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextZone = e.target.value;
    setZone(nextZone);
    if (nextZone) {
      onTimeZoneChange(`${country}/${nextZone}`);
    }
  };

  return (
    <HStack>
      <NativeSelect.Root color="white">
        <NativeSelect.Field placeholder="Select Country" value={country} onChange={handleCountryChange}>
          {Object.keys(PARSED_TIMEZONES).map((c) => (
            <option style={{ color: "#000" }} key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>

      {country && PARSED_TIMEZONES[country] && (
        <NativeSelect.Root color="white">
          <NativeSelect.Field placeholder="Select Zone" value={zone} onChange={handleZoneChange}>
            {PARSED_TIMEZONES[country].map((z) => (
              <option style={{ color: "#000" }} key={z} value={z}>
                {z}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      )}
    </HStack>
  );
}
