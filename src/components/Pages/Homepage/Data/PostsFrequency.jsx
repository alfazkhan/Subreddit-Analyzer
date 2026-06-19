import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Box,
  Heading,
  Text,
  Flex,
  HStack,
  Field,
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const ALL_TZ_OPTIONS = Intl.supportedValuesOf("timeZone");
const PARSED_TIMEZONES = (() => {
  const tzObj = {};
  ALL_TZ_OPTIONS.forEach((tz) => {
    const splitted = tz.split("/");
    if (splitted.length === 2) {
      const [country, zone] = splitted;
      if (!tzObj[country]) tzObj[country] = [];
      tzObj[country].push(zone);
    }
  });
  return tzObj;
})();

export default function PostTime({ data }) {
  const systemTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  
  // Set defaults explicitly to Jan 1st of current year to Today natively
  const defaultDates = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startStr = `${currentYear}-01-01`;
    const endStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return { start: startStr, end: endStr };
  }, []);

  const [activeTz, setActiveTz] = useState(systemTimeZone);
  const [activeStart, setActiveStart] = useState(defaultDates.start);
  const [activeEnd, setActiveEnd] = useState(defaultDates.end);

  const handleAllTime = () => {
    if (!data || data.length === 0) return;

    const timestamps = data
      .map((p) => new Date(p.timestamp).getTime())
      .filter((t) => !isNaN(t));

    if (timestamps.length === 0) return;

    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));

    setActiveStart(minDate.toLocaleDateString("en-CA", { timeZone: activeTz }));
    setActiveEnd(maxDate.toLocaleDateString("en-CA", { timeZone: activeTz }));
  };

  const hourlyData = useMemo(() => {
    const counts = Array(24).fill(0);
    if (!data) return counts;

    data.forEach((post) => {
      if (!post.timestamp) return;

      const dateObj = new Date(post.timestamp);
      const localDateStr = dateObj.toLocaleDateString("en-CA", { timeZone: activeTz });
      
      const localHour = parseInt(
        dateObj.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: activeTz })
      ) % 24;

      const isAfterStart = !activeStart || localDateStr >= activeStart;
      const isBeforeEnd = !activeEnd || localDateStr <= activeEnd;

      if (isAfterStart && isBeforeEnd) {
        counts[localHour]++;
      }
    });
    return counts;
  }, [data, activeStart, activeEnd, activeTz]);

  const chartData = useMemo(() => ({
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
  }), [hourlyData]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { title: (items) => `Time: ${items[0].label} (${activeTz})` },
      },
    },
    scales: {
      x: { ticks: { color: "rgba(255,255,255,0.5)" }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1, color: "rgba(255,255,255,0.5)" } },
    },
  }), [activeTz]);

  return (
    <Box p={6} bg="blackAlpha.400" borderRadius="xl" borderWidth="1px" borderColor="whiteAlpha.200">
      <Flex justifyContent="space-between" alignItems="flex-start" mb={6} wrap="wrap" gap={4}>
        <Box>
          <Heading size="md" color="orange.600">Time Distribution</Heading>
          <Text fontSize="xs" color="whiteAlpha.500">Currently showing: {activeTz}</Text>
        </Box>

        <HStack gap={4} wrap="wrap" alignItems="flex-start">
          <Button type="button" size="sm" mt={5} variant="outline" colorPalette="orange" onClick={handleAllTime}>
            All Time
          </Button>

          <Field.Root width="auto" mt={5}>
            <Field.Label fontSize="xs">Timezone</Field.Label>
            <TimeZoneSelect onTimeZoneChange={setActiveTz} currentTimeZone={activeTz} />
          </Field.Root>

          <DateSelector 
            start={activeStart}
            end={activeEnd}
            onChange={(s, e) => {
              setActiveStart(s);
              setActiveEnd(e);
            }} 
          />
        </HStack>
      </Flex>

      <Box height="350px">
        <Line data={chartData} options={options} />
      </Box>

      {activeStart && activeEnd && (
        <Badge variant="surface" mt={4} colorPalette="orange">
          Range: {activeStart} to {activeEnd}
        </Badge>
      )}
    </Box>
  );
}

function TimeZoneSelect({ onTimeZoneChange, currentTimeZone }) {
  const [initialCountry, initialZone] = currentTimeZone.includes("/") 
    ? currentTimeZone.split("/") 
    : ["", ""];

  const [country, setCountry] = useState(initialCountry);
  const [zone, setZone] = useState(initialZone);

  useEffect(() => {
    if (currentTimeZone.includes("/")) {
      const [c, z] = currentTimeZone.split("/");
      setCountry(c);
      setZone(z);
    }
  }, [currentTimeZone]);

  const handleCountryChange = (e) => {
    const nextCountry = e.currentTarget.value;
    setCountry(nextCountry);
    setZone("");
  };

  const handleZoneChange = (e) => {
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
            <option style={{ color: "#000" }} key={c} value={c}>{c}</option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      
      {country && PARSED_TIMEZONES[country] && (
        <NativeSelect.Root color="white">
          <NativeSelect.Field placeholder="Select Zone" value={zone} onChange={handleZoneChange}>
            {PARSED_TIMEZONES[country].map((z) => (
              <option style={{ color: "#000" }} key={z} value={z}>{z}</option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      )}
    </HStack>
  );
}