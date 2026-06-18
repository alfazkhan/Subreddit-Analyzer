import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Box,
  Heading,
  Text,
  Flex,
  HStack,
  Field,
  Input,
  Badge,
  Button,
  NativeSelect,
} from "@chakra-ui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import DateSelector from "@/components/ui-components/DateSelector";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

export default function PostTime({ data }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const handleAllTime = () => {
    if (!data || data.length === 0) return;

    const timestamps = data
      .map((p) => new Date(p.timestamp).getTime())
      .filter((t) => !isNaN(t));

    if (timestamps.length === 0) return;

    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));

    const formatDate = (date) =>
      date.toLocaleDateString("en-CA", { timeZone: timezone });

    setStartDate(formatDate(minDate));
    setEndDate(formatDate(maxDate));
  };

  const hourlyData = useMemo(() => {
    const counts = Array(24).fill(0);

    data.forEach((post) => {
      if (!post.timestamp) return;

      const dateObj = new Date(post.timestamp);
      const localDate = dateObj.toLocaleDateString("en-CA", {
        timeZone: timezone,
      });
      const localHour =
        parseInt(
          dateObj.toLocaleString("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: timezone,
          }),
        ) % 24;

      const isAfterStart = !startDate || localDate >= startDate;
      const isBeforeEnd = !endDate || localDate <= endDate;

      if (isAfterStart && isBeforeEnd) {
        counts[localHour]++;
      }
    });
    return counts;
  }, [data, startDate, endDate, timezone]);

  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: "Post Count",
        data: hourlyData,
        fill: true,
        borderColor: "#dd6b20",
        backgroundColor: "rgba(221, 107, 32, 0.1)",
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => `Time: ${items[0].label} (${timezone})`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.5)" },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: "rgba(255,255,255,0.5)" },
      },
    },
  };

  function dateHandler(dates){
    if(dates.length === 2){
      setStartDate(dates[0])
      setEndDate(dates[1])
    }
  }

  return (
    <Box
      p={6}
      bg="blackAlpha.400"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
    >
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        mb={6}
        wrap="wrap"
        gap={4}
      >
        <Box>
          <Heading size="md" color="orange.600">
            Time Distribution
          </Heading>
          <Text fontSize="xs" color="whiteAlpha.500">
            Currently showing: {timezone}
          </Text>
        </Box>

        <HStack gap={4} wrap="wrap" alignItems="flex-end">
          <Button
            size="sm"
            variant="outline"
            colorPalette="orange"
            onClick={handleAllTime}
          >
            All Time
          </Button>

          <Field.Root width="auto">
            <Field.Label fontSize="xs">Timezone</Field.Label>
            <TimeZoneSelect onTimeZoneChange={setTimezone} />
          </Field.Root>

          <DateSelector dateSetter={dateHandler}/>
        </HStack>
      </Flex>

      <Box height="350px">
        <Line data={chartData} options={options} />
      </Box>

      {startDate && endDate && (
        <Badge variant="surface" mt={4} colorPalette="orange">
          Range: {startDate} to {endDate}
        </Badge>
      )}
    </Box>
  );
}

function TimeZoneSelect({ onTimeZoneChange }) {
  const [country, setCountry] = useState("");
  const [zone, setZone] = useState("");
  const tzOptions = Intl.supportedValuesOf("timeZone");
  let timeZonesObject = useMemo(() => {
    const timeZonesObject = {};
    tzOptions.map((tz) => {
      const splitted = tz.split("/");
      if (
        Object.keys(timeZonesObject).findIndex((e) => e === splitted[0]) === -1
      ) {
        timeZonesObject[splitted[0]] = [splitted[1]];
      } else {
        timeZonesObject[splitted[0]] = [
          ...timeZonesObject[splitted[0]],
          splitted[1],
        ];
      }
    });
    return timeZonesObject;
  }, [tzOptions]);

  return (
    <HStack>
      <NativeSelect.Root color="white">
        <NativeSelect.Field
          placeholder="Select Country"
          value={country}
          onChange={(e) => setCountry(e.currentTarget.value)}
        >
          {Object.keys(timeZonesObject).map((country) => (
            <option style={{ color: "#000" }} key={country} value={country}>
              {country}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      {country !== "" && (
        <NativeSelect.Root color="white">
          <NativeSelect.Field
            placeholder="Select Zone"
            value={zone}
            onChange={(e) => {
              onTimeZoneChange(`${country}/${e.target.value}`);
              setZone(e.target.value);
            }}
          >
            {timeZonesObject[country].map((zone) => (
              <option style={{ color: "#000" }} key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      )}
    </HStack>
  );
}
