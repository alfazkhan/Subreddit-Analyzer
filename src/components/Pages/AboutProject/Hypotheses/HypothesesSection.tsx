import { Box, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { HYPOTHESES_PILLARS, THESIS_METADATA } from "@/data/aboutContent";
import { HypothesisCard } from "./HypothesisCard";
import { C, Section, VerdictPill } from "../aboutUi";
import { LuArrowRight } from "react-icons/lu";

const ALL_HYPOTHESES = HYPOTHESES_PILLARS.flatMap((p) => p.hypotheses);

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const word = (count: number) => NUMBER_WORDS[count] ?? String(count);

function verdictSummary() {
  const count = (v: string) => ALL_HYPOTHESES.filter((h) => h.verdict === v).length;
  const parts = [
    `${word(count("Supported"))} held up`,
    count("Supported, small effect") && `${word(count("Supported, small effect"))} held up with a tiny effect`,
    count("Inconclusive") && `${word(count("Inconclusive"))} couldn't be tested`,
  ].filter(Boolean) as string[];
  const sentence = parts.length > 1 ? `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}` : parts[0];
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function scrollToCard(e: React.MouseEvent, id: string) {
  e.preventDefault();
  document.getElementById(`hypothesis-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HypothesesSection() {
  const n = THESIS_METADATA.snapshotSampleSize.toLocaleString("en-US");

  return (
    <Section
      id="section-hypotheses"
      title="Findings"
      lede={`${word(ALL_HYPOTHESES.length).replace(/^./, (c) => c.toUpperCase())} hypotheses, tested on a frozen snapshot of ${n} posts from ${THESIS_METADATA.snapshotDate}. ${verdictSummary()}`}
    >
      {/* Results at a glance */}
      <Box overflowX="auto">
        <Box as="table" width="full" style={{ borderCollapse: "collapse" }}>
          <caption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            Summary of all hypothesis results
          </caption>
          <thead>
            <Box as="tr" borderBottomWidth="1px" borderColor={C.line}>
              {["", "Question", "Answer", "Verdict"].map((h) => (
                <Box
                  as="th"
                  key={h}
                  textAlign="left"
                  fontSize="xs"
                  fontWeight="medium"
                  color={C.muted}
                  py={2}
                  pr={4}
                  // The question repeats in each card; drop it on narrow screens
                  display={h === "Question" ? { base: "none", md: "table-cell" } : undefined}
                >
                  {h}
                </Box>
              ))}
            </Box>
          </thead>
          <tbody>
            {ALL_HYPOTHESES.map((h) => (
              <Box as="tr" key={h.id} borderBottomWidth="1px" borderColor="whiteAlpha.100" verticalAlign="top">
                <Box as="td" py={3} pr={4}>
                  <Box
                    as="a"
                    href={`#hypothesis-${h.id}`}
                    onClick={(e: React.MouseEvent) => scrollToCard(e, h.id)}
                    fontFamily="mono"
                    fontSize="sm"
                    color={C.accent}
                    textDecoration="none"
                    _hover={{ textDecoration: "underline" }}
                  >
                    {h.id}
                  </Box>
                </Box>
                <Box
                  as="td"
                  py={3}
                  pr={4}
                  fontSize="sm"
                  color="gray.200"
                  lineHeight="1.5"
                  width="42%"
                  display={{ base: "none", md: "table-cell" }}
                >
                  {h.plainQuestion}
                </Box>
                <Box as="td" py={3} pr={4} fontSize="sm" color={C.text} lineHeight="1.5">
                  {h.shortFinding}
                </Box>
                <Box as="td" py={3}>
                  <VerdictPill verdict={h.verdict} />
                </Box>
              </Box>
            ))}
          </tbody>
        </Box>
      </Box>

      <Text fontSize="sm" color={C.muted} mt={4}>
        Significance level α = {THESIS_METADATA.alphaLevel}. The backend (<code>Scraping/database/kpis.py</code>) is the
        source of truth.{" "}
        <RouterLink to="/#kpis" style={{ color: "var(--chakra-colors-orange-300)" }}>
          See live results on the KPI tab <LuArrowRight style={{ display: "inline", verticalAlign: "-2px" }} />
        </RouterLink>
      </Text>

      {/* Detail, grouped by theme */}
      <Box display="grid" gap={14} mt={14}>
        {HYPOTHESES_PILLARS.map((pillar) => (
          <Box key={pillar.id}>
            <Box mb={5}>
              <Text as="h3" fontSize="xl" fontWeight="semibold" color={C.heading}>
                {pillar.title}
              </Text>
              <Text color={C.muted}>{pillar.subtitle}</Text>
            </Box>
            <Box display="grid" gap={6}>
              {pillar.hypotheses.map((hypothesis) => (
                <HypothesisCard key={hypothesis.id} hypothesis={hypothesis} />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Section>
  );
}
