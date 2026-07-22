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
  Center,
  Spinner,
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
  const systemTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

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
  const [processingStatus, setProcessingStatus] = useState(false);
  const [hourlyData, setHourlyData] = useState(Array(24).fill(0));

  // Logic moved to useEffect to properly trigger loading state
  useEffect(() => {
    let isCancelled = false;

    const processData = async () => {
      setProcessingStatus(true);
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (isCancelled) return;

      const counts = Array(24).fill(0);
      if (data) {
        data.forEach((post) => {
          if (!post.timestamp) return;
          const dateObj = new Date(post.timestamp);
          const localDateStr = dateObj.toLocaleDateString("en-CA", {
            timeZone: activeTz,
          });

          const localHour =
            parseInt(
              dateObj.toLocaleString("en-US", {
                hour: "numeric",
                hour12: false,
                timeZone: activeTz,
              }),
            ) % 24;

          if (localDateStr >= activeStart && localDateStr <= activeEnd) {
            counts[localHour]++;
          }
        });
      }

      setProcessingStatus(false);
      setHourlyData(counts);
    };

    processData();
    return () => {
      isCancelled = true;
    };
  }, [data, activeStart, activeEnd, activeTz]);

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

  const chartData = useMemo(() => {
    return {
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
  }, [hourlyData]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `Time: ${items[0].label} (${activeTz})`,
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
    }),
    [activeTz],
  );

  return (
    <Box
      p={6}
      bg="blackAlpha.400"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      position="relative"
    >
      {processingStatus && (
        <Box
          position="absolute"
          inset="0"
          bg="rgba(23, 23, 27, 0.6)"
          zIndex={10}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner
            borderWidth="4px"
            size="xl"
            color="orange.600"
            animationDuration="0.6s"
          />
        </Box>
      )}

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
            Currently showing: {activeTz}
          </Text>
        </Box>

        <HStack gap={4} wrap="wrap" alignItems="flex-start">
          <Button
            size="sm"
            mt={5}
            variant="outline"
            colorPalette="orange"
            onClick={handleAllTime}
          >
            All Time
          </Button>

          <Field.Root width="auto" mt={5}>
            <Field.Label fontSize="xs">Timezone</Field.Label>
            <TimeZoneSelect
              onTimeZoneChange={setActiveTz}
              currentTimeZone={activeTz}
            />
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
  const [country, setCountry] = useState(currentTimeZone.split("/")[0] || "");
  const [zone, setZone] = useState(currentTimeZone.split("/")[1] || "");

  useEffect(() => {
    if (currentTimeZone.includes("/")) {
      const [c, z] = currentTimeZone.split("/");
      setCountry(c);
      setZone(z);
    }
  }, [currentTimeZone]);

  return (
    <HStack>
      <NativeSelect.Root color="white">
        <NativeSelect.Field
          value={country}
          onChange={(e) => {
            setCountry(e.currentTarget.value);
            setZone("");
          }}
        >
          <option value="">Select Country</option>
          {Object.keys(PARSED_TIMEZONES).map((c) => (
            <option key={c} value={c} style={{ color: "#000" }}>
              {c}
            </option>
          ))}
        </NativeSelect.Field>
      </NativeSelect.Root>
      {country && PARSED_TIMEZONES[country] && (
        <NativeSelect.Root color="white">
          <NativeSelect.Field
            value={zone}
            onChange={(e) => onTimeZoneChange(`${country}/${e.target.value}`)}
          >
            {PARSED_TIMEZONES[country].map((z) => (
              <option key={z} value={z} style={{ color: "#000" }}>
                {z}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      )}
    </HStack>
  );
}
