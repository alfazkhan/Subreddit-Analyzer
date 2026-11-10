import type { FilterFn, RowData } from "@tanstack/react-table";
import type {
  KeywordCountData,
  KeywordCountResult,
  MinMaxSetter,
  PaginationDataSlicer,
  QueueCounts,
} from "@/util/Types";

/**
 * Counts keyword frequencies across an array of posts, skipping numeric keys.
 */
export function keywordCount(data: { keywords?: string }[]): KeywordCountResult {
  const counts: { [key: string]: number } = {};

  data.forEach((post: { keywords?: string }) => {
    const keywords: Record<string, unknown> | null = post.keywords
      ? JSON.parse(post.keywords)
      : null;
    if (!keywords) return;

    Object.keys(keywords).forEach((keyword: string) => {
      if (Number.isInteger(parseInt(keyword))) {
        return;
      }
      counts[keyword] === undefined ? (counts[keyword] = 1) : counts[keyword]++;
    });
  });

  return counts;
}

/**
 * Finds the min and max frequency among the top N keywords and invokes the provided setters.
 */
export function getTopKeywords(
  keywordCountMap: KeywordCountData,
  filteredNumber: number,
  minValueFX: MinMaxSetter,
  maxValueFX: MinMaxSetter,
): void {
  const valuesSet = new Set<number>(Object.values(keywordCountMap));
  const sortedValues = Array.from(valuesSet).sort((a, b) => a - b);
  const minValue = Math.min(...sortedValues.slice(-filteredNumber));
  const maxValue = Math.max(...sortedValues.slice(-filteredNumber));
  minValueFX(minValue);
  maxValueFX(maxValue);
}

/**
 * Finds the minimum and maximum frequency values in a keyword dataset
 * for range filter initialization.
 */
export function findMinMax(
  keywords: readonly { frequency?: unknown }[] | undefined,
): [number, number] {
  if (!keywords || keywords.length === 0) {
    return [0, 100];
  }

  let min = Infinity;
  let max = 0;

  keywords.forEach((word) => {
    const freq = Number(word.frequency) || 0;
    if (freq < min) min = freq;
    if (freq > max) max = freq;
  });

  if (min === max) {
    return [0, max || 100];
  }

  return [min, max];
}

/**
 * Slices a dataset array for client-side pagination.
 */
export const paginationDataSlicer: PaginationDataSlicer = (
  data,
  currentPage,
  pageSize,
) => {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return data?.slice(start, end);
};

/**
 * Merges partial queue count updates into the current QueueCounts object.
 */
export function mergeQueueCounts(
  current: QueueCounts,
  updates: Partial<QueueCounts>,
): QueueCounts {
  return {
    total: updates.total ?? current.total,
    pending: updates.pending ?? current.pending,
    processing: updates.processing ?? current.processing,
    completed: updates.completed ?? current.completed,
    failed: updates.failed ?? current.failed,
  };
}

/**
 * Placeholder utility for normalizing keyword entity text.
 */
export function tempKeywordEntitiesFix(text: string): string {
  const fixedText = text;
  return fixedText;
}

/**
 * Creates a case-insensitive substring TanStack Table filter that ignores queries
 * shorter than `minLength` characters.
 */
export function createMinLengthFilterFn<TData extends RowData>(
  minLength = 2,
): FilterFn<TData> {
  return (row, columnID, filterValue) => {
    const query = String(filterValue ?? "");
    return (
      query.length < minLength ||
      String(row.getValue(columnID) ?? "")
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  };
}

/**
 * Returns a new array with `value` added or removed according to `checked`
 * (or toggled when `checked` is omitted).
 */
export function toggleArrayItem<T>(
  items: readonly T[],
  value: T,
  checked?: boolean | "indeterminate",
): T[] {
  const exists = items.includes(value);
  const shouldInclude = checked === undefined ? !exists : checked === true;

  if (shouldInclude && !exists) {
    return [...items, value];
  }
  if (!shouldInclude && exists) {
    return items.filter((item) => item !== value);
  }
  return [...items];
}

/**
 * Builds the canonical Reddit permalink URL for a post ID (stripping the `t3_` prefix).
 */
export function getRedditPostUrl(
  subredditName: string | undefined,
  postId: string,
): string {
  return `https://www.reddit.com/r/${subredditName ?? ""}/comments/${postId.substring(3)}`;
}

// ── Color Utilities ────────────────────────────────────────────────

/**
 * Deterministic HSL color generator based on hashing the input string.
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

/**
 * Maps a password strength percentage to a display label and Chakra color palette.
 */
export function getColorPalette(percent: number): {
  label: string;
  colorPalette: string;
} {
  switch (true) {
    case percent < 33:
      return { label: "Low", colorPalette: "red" };
    case percent < 66:
      return { label: "Medium", colorPalette: "orange" };
    default:
      return { label: "High", colorPalette: "green" };
  }
}
