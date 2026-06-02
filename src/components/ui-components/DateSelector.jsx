import { DatePicker, Portal, parseDate } from "@chakra-ui/react";
import { LuCalendar } from "react-icons/lu";

export default function DateSelector({dateSetter}) {
  function dateHandler(e) {
    const dates = e.value.map((d) => d.toString()).join(", ")
    // console.log(dates);
    dateSetter(dates.split(", "))
  }
  return (
    <DatePicker.Root
      selectionMode="range"
      maxWidth="20rem"
      openOnClick
      placeholder="dd/mm/yy"
      format={format}
      onValueChange={dateHandler}
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
