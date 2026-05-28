export default function getTopKeywords(keywordCount,filteredNumber, minValueFX, maxValueFX){
    const valuesSet = new Set(Object.values(keywordCount));
    const sortedValues = Array.from(valuesSet).sort((a, b) => a - b);
    const minValue = Math.min(...sortedValues.slice(-filteredNumber));
    const maxValue = Math.max(...sortedValues.slice(-filteredNumber));
    minValueFX(minValue);
    maxValueFX(maxValue);
  }