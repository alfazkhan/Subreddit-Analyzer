import {
  DatePicker,
  Portal,
  parseDate,
  Flex,
  Button,
  VStack,
} from "@chakra-ui/react";
import { LuCalendar } from "react-icons/lu";

export default function DateSelector({ dateSetter }) {
  function dateHandler(e) {
    const dates = e.value.map((d) => d.toString()).join(", ");
    // console.log(dates);
    dateSetter(dates.split(", "));
  }
  return (
    <DatePicker.Root
      selectionMode="range"
      maxWidth="20rem"
      openOnClick
      placeholder="dd/mm/yy"
      format={format}
      onValueChange={dateHandler}
      defaultView="month"
    >
      <DatePicker.Label>Select range</DatePicker.Label>
      <DatePicker.Control>
        <DatePicker.Input index={0} color="gray.100" />
        <DatePicker.Input index={1} color="gray.100" />
        <DatePicker.IndicatorGroup>
          <DatePicker.Trigger color="gray.100">
            <LuCalendar />
          </DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <Flex
              px={{ base: "3", sm: "4" }}
              py={{ base: "3", sm: "4" }}
              gap={{ base: "3", sm: "6" }}
              flexDirection={{ base: "column", sm: "row" }}
            >
              <VStack
                align="stretch"
                gap={{ base: "1.5", sm: "2" }}
                minW={{ base: "full", sm: "140px" }}
                height="100%"
              >
                <DatePicker.PresetTrigger value="last7Days" asChild>
                  <Button variant="surface" size="sm" width="100%">
                    Last 7 days
                  </Button>
                </DatePicker.PresetTrigger>
                <DatePicker.PresetTrigger value="last30Days" asChild>
                  <Button variant="surface" size="sm" width="100%">
                    Last 30 days
                  </Button>
                </DatePicker.PresetTrigger>
                <DatePicker.PresetTrigger value="thisMonth" asChild>
                  <Button variant="surface" size="sm" width="100%">
                    This month
                  </Button>
                </DatePicker.PresetTrigger>
                <DatePicker.PresetTrigger value="lastMonth" asChild>
                  <Button variant="surface" size="sm" width="100%">
                    Last month
                  </Button>
                </DatePicker.PresetTrigger>
                <DatePicker.PresetTrigger value="thisYear" asChild>
                  <Button variant="surface" size="sm" width="100%">
                    This year
                  </Button>
                </DatePicker.PresetTrigger>
                <DatePicker.PresetTrigger value="lastYear" asChild>
                  <Button variant="surface" size="sm" width="100%">
                    Last year
                  </Button>
                </DatePicker.PresetTrigger>
              </VStack>
              <Flex direction="column" flex="1" minW={0}>
                <DatePicker.View view="day">
                  <DatePicker.Header />
                  <DatePicker.DayTable />
                </DatePicker.View>
                <DatePicker.View view="month">
                  <DatePicker.Header />
                  <DatePicker.MonthTable />
                </DatePicker.View>
                <DatePicker.View view="year">
                  <DatePicker.Header />
                  <DatePicker.YearTable />
                </DatePicker.View>
              </Flex>
            </Flex>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}

function format(date) {
  const day = date.day.toString().padStart(2, "0");
  const month = date.month.toString().padStart(2, "0");
  const year = (date.year % 100).toString().padStart(2, "0");
  return `${day}/${month}/${year}`;
}
