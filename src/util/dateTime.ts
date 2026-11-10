import type { FormatTimeOptions } from "@/util/Types";

/**
 * Formats a duration in seconds into a human-readable string (e.g., "1h 30m 45s").
 */
export function formatTime(seconds: FormatTimeOptions["seconds"]): string {
  if (seconds < 1) return "Calculating...";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(" ");
}

/**
 * Formats a Date object as a local ISO date string (YYYY-MM-DD),
 * avoiding UTC timezone shifts. Defaults to today's date.
 */
export function getLocalISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Returns the date range from January 1st of the current year through today (YYYY-MM-DD).
 */
export function getYearStartToToday(today: Date = new Date()): {
  start: string;
  end: string;
} {
  return {
    start: `${today.getFullYear()}-01-01`,
    end: getLocalISODate(today),
  };
}

/**
 * Formats a raw timestamp string into a human-readable date/time display
 * ("Today at HH:MM", "Yesterday at HH:MM", or "DD/MM/YYYY HH:MM AM/PM").
 */
export function dateTimeFormatter(rawTimestamp: string | undefined): string {
  if (!rawTimestamp) return "N/A";

  const targetDate = new Date(rawTimestamp);
  if (isNaN(targetDate.getTime())) return "Invalid Date";

  const timeString = targetDate
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();

  const targetDay = new Date(targetDate);
  targetDay.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (targetDay.getTime() === today.getTime()) {
    return `Today at ${timeString}`;
  }

  if (targetDay.getTime() === yesterday.getTime()) {
    return `Yesterday at ${timeString}`;
  }

  const fullDateString = targetDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${fullDateString} ${timeString}`;
}

/**
 * Parses IANA timezone identifiers into a dictionary grouped by region/country.
 */
export function parseTimezones(
  timezones: readonly string[] = Intl.supportedValuesOf("timeZone"),
): Record<string, string[]> {
  const tzObj: Record<string, string[]> = {};
  timezones.forEach((tz) => {
    const splitted = tz.split("/");
    if (splitted.length === 2) {
      const [country, zone] = splitted;
      if (!tzObj[country]) tzObj[country] = [];
      tzObj[country].push(zone);
    }
  });
  return tzObj;
}
