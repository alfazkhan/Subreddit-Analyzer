import type { KeywordCountData, MinMaxSetter } from "@/util/Types";

export default function getTopKeywords(
  keywordCount: KeywordCountData,
  filteredNumber: number,
  minValueFX: MinMaxSetter,
  maxValueFX: MinMaxSetter,
): void {
    const valuesSet = new Set<number>(Object.values(keywordCount));
    const sortedValues = Array.from(valuesSet).sort((a, b) => a - b);
    const minValue = Math.min(...sortedValues.slice(-filteredNumber));
    const maxValue = Math.max(...sortedValues.slice(-filteredNumber));
    minValueFX(minValue);
    maxValueFX(maxValue);
  }