import type { AdminUserRole, SentimentLabel } from "@/util/Types";

export const BASE_URL = "https://api.theonlyalfaz.com";

export const wsUrl = "wss://api.theonlyalfaz.com/ws/reanalyze";

export const SENTIMENT_FILTER_CONFIG = [
  { emoji: "", color: "#009637", label: "All" },
  { emoji: "😊", color: "#009637", label: "Positive" },
  { emoji: "😐", color: "#52719c", label: "Neutral" },
  { emoji: "😠", color: "#aa0505", label: "Negative" },
] as const;

export const SENTIMENT_DISPLAY_CONFIG: Record<
  SentimentLabel,
  { emoji: string; color: string; label: SentimentLabel }
> = {
  Positive: { emoji: "😊", color: "#4ade80", label: "Positive" },
  Neutral: { emoji: "😐", color: "#94a3b8", label: "Neutral" },
  Negative: { emoji: "😠", color: "#f87171", label: "Negative" },
};

export const TOPICS_CONFIG = [
  // Housing & Living Accommodations
  "Rent Prices & Affordability",
  "Apartment Viewings & Contracts",
  "Flatmates & Shared Housing",
  "Landlord Disputes & Evictions",
  "Utility Bills & Energy Costs",
  "Home Maintenance & Damage Repairs",

  // Public Transit & Urban Mobility
  "Subway, Tram & Train Schedules",
  "Bus Routes & Reliability",
  "Transit Passes & Ticket Pricing",
  "Bicycle Lanes & Cycling Safety",
  "Traffic Congestion & Roadwork",
  "City Parking & Driving Permits",

  // Local Administration, Law & Politics
  "City Registration & Paperwork",
  "Visas & Residence Permits",
  "Local Elections & Candidates",
  "City Council Policies & Budgets",
  "Protests, Strikes & Demonstrations",

  // Jobs & Daily Economy
  "Job Postings & Career Advice",
  "Student Shifts & Part-Time Work",
  "Supermarket Prices & Groceries",
  "Salaries & Cost of Living Rants",

  // Social Life, Culture & Recreation
  "Restaurant & Cafe Reviews",
  "Bars, Nightclubs & Nightlife",
  "Street Food & Local Cuisines",
  "Festivals, Concerts & Public Events",
  "Museums, Art & Theater",
  "Amateur Sports & Fitness Groups",

  // Public Safety & Travel
  "Tourist Attractions & Sightseeing",
  "Neighborhood Safety & Crime Alerts",
  "Lost Items & Found Belongings",
] as const;

export const ADMIN_USER_ROLES: readonly AdminUserRole[] = [
  "Super Admin",
  "Admin",
  "Guest User",
  "Developer",
];

export const REPORTED_WORD_FILTER_OPTIONS = [
  { value: "true", text: "All" },
  { value: "false", text: "Hide Reported Word" },
];

export const ORANGE_TABS_CSS = {
  "--tabs-indicator-bg": "colors.orange.600",
  "--tabs-indicator-color": "colors.orange.600",
} as const;

export const ORANGE_TABS_OPEN_ANIMATION = {
  animation: "fade-in 800ms ease-out",
} as const;
