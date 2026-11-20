import { Box, Text } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { DATA_METHOD_CONTENT, THESIS_METADATA } from "@/data/aboutContent";
import type { RootState } from "@/util/Types";
import { C, P, Section, SubHeading } from "./aboutUi";
import { LuCheck, LuX } from "react-icons/lu";

const FALLBACK_CITIES = [
  "amsterdam", "berlin", "delhi", "hongkong", "london", "losangeles",
  "mumbai", "munich", "nyc", "singapore", "toronto",
];

function IconList({ items, kept }: { items: { label: string; detail?: string }[]; kept: boolean }) {
  return (
    <Box as="ul" m={0} p={0} listStyleType="none" display="grid" gap={2.5}>
      {items.map((item) => (
        <Box as="li" key={item.label} display="flex" gap={2.5} alignItems="flex-start">
          <Box as="span" mt="4px" flexShrink={0} color={kept ? "green.300" : "red.300"} aria-hidden="true">
            {kept ? <LuCheck size={15} /> : <LuX size={15} />}
          </Box>
          <Box>
            <Text color="gray.200" lineHeight="1.6">
              {item.label}
            </Text>
            {item.detail && (
              <Text fontSize="sm" color={C.muted} lineHeight="1.5">
                {item.detail}
              </Text>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function DataMethodSection() {
  const latestSummary = useSelector((state: RootState) => state.serverStatusState.latestSummary);
  const liveCities = Object.keys(latestSummary || {});
  const cities = liveCities.length > 0 ? [...liveCities].sort() : FALLBACK_CITIES;
  const n = THESIS_METADATA.snapshotSampleSize.toLocaleString("en-US");

  return (
    <Section id="section-data-method" title="Data">
      <Box display="grid" gap={12}>
        <Box>
          <SubHeading>Why wait 7 days?</SubHeading>
          <P>{DATA_METHOD_CONTENT.maturityWindowExplanation}</P>
        </Box>

        <Box>
          <SubHeading>What's collected, and what isn't</SubHeading>
          <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={{ base: 8, md: 10 }} mt={4}>
            <Box>
              <Text fontSize="sm" color={C.muted} mb={3}>
                Kept for each post
              </Text>
              <IconList kept items={DATA_METHOD_CONTENT.storedFields.map((f) => ({ label: f.field, detail: f.detail }))} />
            </Box>
            <Box>
              <Text fontSize="sm" color={C.muted} mb={3}>
                Never collected
              </Text>
              <IconList kept={false} items={DATA_METHOD_CONTENT.deliberatelyExcludedFields.map((label) => ({ label }))} />
            </Box>
          </Box>
        </Box>

        <Box>
          <SubHeading>Cleaning</SubHeading>
          <P mb={3}>
            Before analysis, <code>Scraping/database/kpis.py</code> drops:
          </P>
          <Box as="ul" m={0} pl={5} listStyleType="disc" color={C.text} lineHeight="1.8" display="grid" gap={0.5}>
            {DATA_METHOD_CONTENT.cleaningFilters.map((filter) => (
              <li key={filter}>{filter}</li>
            ))}
          </Box>
          <P mt={4}>
            That leaves <Text as="strong" color={C.heading}>{n} posts</Text> in the thesis snapshot, frozen in{" "}
            {THESIS_METADATA.snapshotDate}. The live database keeps collecting and now holds over 85,000 cleaned posts.
          </P>
        </Box>

        <Box>
          <SubHeading>Cities</SubHeading>
          <P mb={3}>
            {cities.length} subreddits, each analysed in its own local time zone:
          </P>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {cities.map((city) => (
              <Box
                key={city}
                as="span"
                fontFamily="mono"
                fontSize="sm"
                color="gray.200"
                bg="whiteAlpha.100"
                px={2.5}
                py={1}
                borderRadius="md"
              >
                r/{city.toLowerCase()}
              </Box>
            ))}
          </Box>
        </Box>

        <Box>
          <SubHeading>Language models</SubHeading>
          <P mb={4}>All four run locally, on a GPU when one is available and on the CPU otherwise.</P>
          <Box overflowX="auto">
            <Box as="table" width="full" minW="520px" style={{ borderCollapse: "collapse" }}>
              <thead>
                <Box as="tr" borderBottomWidth="1px" borderColor={C.line}>
                  {["Task", "Model", "What it produces"].map((h) => (
                    <Box as="th" key={h} textAlign="left" fontSize="xs" fontWeight="medium" color={C.muted} py={2} pr={4}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </thead>
              <tbody>
                {DATA_METHOD_CONTENT.nlpModels.map((m) => (
                  <Box as="tr" key={m.domain} borderBottomWidth="1px" borderColor="whiteAlpha.100" verticalAlign="top">
                    <Box as="td" py={3} pr={4} fontSize="sm" fontWeight="medium" color={C.heading} whiteSpace="nowrap">
                      {m.domain}
                    </Box>
                    <Box as="td" py={3} pr={4} fontFamily="mono" fontSize="xs" color="gray.400" maxW="220px" wordBreak="break-word">
                      {m.model}
                    </Box>
                    <Box as="td" py={3} fontSize="sm" color={C.text} lineHeight="1.6">
                      {m.derivedVariables}
                    </Box>
                  </Box>
                ))}
              </tbody>
            </Box>
          </Box>
        </Box>
      </Box>
    </Section>
  );
}
