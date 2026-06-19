import { useEffect, useState } from "react";
import { HStack, NativeSelect } from "@chakra-ui/react";

// Best Practice: Compute static lookup dictionaries outside the component lifecycle
// This prevents O(N) recalculations every time the parent re-renders.
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

export default function TimeZoneSelect({ onTimeZoneChange, currentTimeZone }) {
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