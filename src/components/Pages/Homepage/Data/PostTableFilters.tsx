import { FilterChipRow } from "@/components/ui-components/FormControls";
import { SENTIMENT_FILTER_CONFIG, TOPICS_CONFIG } from "@/util/constants";
import type { PostTableFilterProps } from "@/util/Types";

const SENTIMENT_CHIP_OPTIONS = SENTIMENT_FILTER_CONFIG.map((emotion) => ({
  value: emotion.label,
  label: emotion.label,
  emoji: emotion.emoji,
}));

const TOPIC_CHIP_OPTIONS = TOPICS_CONFIG.map((topic) => ({
  value: topic,
  label: topic,
}));

export default function PostTableFilter({
  sentiment,
  onSentimentChange,
  topics,
  onTopicsChange,
}: PostTableFilterProps) {
  return (
    <>
      <FilterChipRow
        title="Filter Posts By"
        options={SENTIMENT_CHIP_OPTIONS}
        selectedValue={sentiment}
        onSelect={onSentimentChange}
      />
      <FilterChipRow
        title="Filter Posts By"
        options={TOPIC_CHIP_OPTIONS}
        selectedValue={topics}
        onSelect={onTopicsChange}
        overflowX="scroll"
        labelFontSize="xx-small"
      />
    </>
  );
}
