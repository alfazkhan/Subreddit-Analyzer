import { Input, Text, VStack, HStack, Button, Flex } from "@chakra-ui/react";

// Best Practice: Format date natively to avoid UTC timezone shifts when converting
const getLocalISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function DateSelector({ start, end, onChange }) {
  
  const handlePreset = (preset) => {
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

  return (
    <VStack align="start" gap={3}>
      <Flex wrap="wrap" gap={2} maxWidth="300px">
        <Button size="xs" variant="surface" onClick={() => handlePreset("last7Days")}>Last 7 days</Button>
        <Button size="xs" variant="surface" onClick={() => handlePreset("last30Days")}>Last 30 days</Button>
        <Button size="xs" variant="surface" onClick={() => handlePreset("thisMonth")}>This month</Button>
        <Button size="xs" variant="surface" onClick={() => handlePreset("lastMonth")}>Last month</Button>
        <Button size="xs" variant="surface" onClick={() => handlePreset("thisYear")}>This year</Button>
        <Button size="xs" variant="surface" onClick={() => handlePreset("lastYear")}>Last year</Button>
      </Flex>

      <HStack gap={4} alignItems="center">
        <VStack align="start" gap={1}>
          <Text fontSize="xs" color="whiteAlpha.500">Start Date</Text>
          <Input
            type="date"
            size="sm"
            value={start}
            max={end || undefined}
            onChange={(e) => onChange(e.target.value, end)}
            color="white"
            bg="whiteAlpha.100"
            borderColor="whiteAlpha.300"
          />
        </VStack>
        <VStack align="start" gap={1}>
          <Text fontSize="xs" color="whiteAlpha.500">End Date</Text>
          <Input
            type="date"
            size="sm"
            value={end}
            min={start || undefined}
            onChange={(e) => onChange(start, e.target.value)}
            color="white"
            bg="whiteAlpha.100"
            borderColor="whiteAlpha.300"
          />
        </VStack>
      </HStack>
    </VStack>
  );
}