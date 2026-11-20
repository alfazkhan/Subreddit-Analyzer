import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { PIPELINE_STEPS } from "@/data/aboutContent";
import { GlossaryTerm } from "./GlossaryTerm";
import { LuLayers, LuServer, LuCpu, LuDatabase, LuArrowRight } from "react-icons/lu";

export function SystemArchitectureSection() {
  return (
    <Box id="section-architecture">
      <VStack align="stretch" gap={6}>
        <Heading as="h2" size="xl" color="orange.400" fontWeight="semibold" pb={2} borderBottom="1px solid" borderColor="gray.800">
          How It Works: System Architecture &amp; Data Pipeline
        </Heading>

        <Text color="gray.300" fontSize="md" lineHeight="1.8">
          The platform operates as a decoupled data pipeline. Data flows from public community feeds through an automated browser crawler,
          a mandatory <GlossaryTerm termId="maturity-window">7-day maturity queue</GlossaryTerm>, self-hosted relational storage, an offline
          multilingual <GlossaryTerm termId="nlp-pipeline">NLP pipeline</GlossaryTerm>, and an asynchronous API layer to the React dashboard.
        </Text>

        {/* Hand-built SVG Pipeline Diagram */}
        <Box
          bg="gray.950"
          borderWidth="1px"
          borderColor="gray.800"
          borderRadius="xl"
          p={{ base: 4, md: 6 }}
          overflowX="auto"
        >
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={4}>
            End-to-End Processing Architecture (Verified against code)
          </Text>

          <svg
            viewBox="0 0 920 200"
            width="100%"
            height="auto"
            style={{ minWidth: "780px" }}
            aria-label="System architecture pipeline diagram showing data flow from Reddit to React dashboard"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
              </marker>
            </defs>

            {/* Step 1: Reddit */}
            <g transform="translate(10, 40)">
              <rect width="125" height="110" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
              <text x="62" y="32" fill="#f97316" fontSize="12" fontWeight="bold" textAnchor="middle">1. Reddit Feeds</text>
              <text x="62" y="55" fill="#e4e4e7" fontSize="11" textAnchor="middle">City Subreddits</text>
              <text x="62" y="75" fill="#a1a1aa" fontSize="10" textAnchor="middle">r/berlin, r/nyc...</text>
              <text x="62" y="95" fill="#71717a" fontSize="9" textAnchor="middle">Public Web DOM</text>
            </g>

            <line x1="135" y1="95" x2="160" y2="95" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Step 2: Playwright */}
            <g transform="translate(165, 40)">
              <rect width="130" height="110" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
              <text x="65" y="32" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">2. Playwright</text>
              <text x="65" y="55" fill="#e4e4e7" fontSize="11" textAnchor="middle">Headless Chromium</text>
              <text x="65" y="75" fill="#a1a1aa" fontSize="10" textAnchor="middle">scraper_v2.py</text>
              <text x="65" y="95" fill="#71717a" fontSize="9" textAnchor="middle">No API keys needed</text>
            </g>

            <line x1="295" y1="95" x2="320" y2="95" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Step 3: 7-Day Maturity Queue */}
            <g transform="translate(325, 40)">
              <rect width="135" height="110" rx="8" fill="#18181b" stroke="#f97316" strokeWidth="2" />
              <text x="67" y="32" fill="#f97316" fontSize="12" fontWeight="bold" textAnchor="middle">3. Maturity Queue</text>
              <text x="67" y="55" fill="#e4e4e7" fontSize="11" textAnchor="middle">7-Day Delay Gate</text>
              <text x="67" y="75" fill="#a1a1aa" fontSize="10" textAnchor="middle">run_worker.py</text>
              <text x="67" y="95" fill="#fb923c" fontSize="9" textAnchor="middle">Stabilizes votes &amp; msgs</text>
            </g>

            <line x1="460" y1="95" x2="485" y2="95" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Step 4: PostgreSQL */}
            <g transform="translate(490, 40)">
              <rect width="130" height="110" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
              <text x="65" y="32" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">4. PostgreSQL 15</text>
              <text x="65" y="55" fill="#e4e4e7" fontSize="11" textAnchor="middle">reddit_posts DB</text>
              <text x="65" y="75" fill="#a1a1aa" fontSize="10" textAnchor="middle">GIN &amp; Cursor Indexes</text>
              <text x="65" y="95" fill="#71717a" fontSize="9" textAnchor="middle">LISTEN / NOTIFY</text>
            </g>

            <line x1="620" y1="95" x2="645" y2="95" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Step 5: Offline NLP */}
            <g transform="translate(650, 20)">
              <rect width="130" height="150" rx="8" fill="#18181b" stroke="#c084fc" strokeWidth="1.5" />
              <text x="65" y="26" fill="#c084fc" fontSize="12" fontWeight="bold" textAnchor="middle">5. Local Offline NLP</text>
              <text x="65" y="48" fill="#e4e4e7" fontSize="10" textAnchor="middle">nlp_processor.py</text>
              <line x1="10" y1="58" x2="120" y2="58" stroke="#3f3f46" strokeWidth="1" />
              <text x="65" y="75" fill="#a1a1aa" fontSize="9" textAnchor="middle">XLM-RoBERTa (Pneg)</text>
              <text x="65" y="93" fill="#a1a1aa" fontSize="9" textAnchor="middle">mDeBERTa-v3 (30 topics)</text>
              <text x="65" y="111" fill="#a1a1aa" fontSize="9" textAnchor="middle">SpaCy (16 entities)</text>
              <text x="65" y="129" fill="#a1a1aa" fontSize="9" textAnchor="middle">NLTK (Lemmas, TTR)</text>
            </g>

            <line x1="780" y1="95" x2="805" y2="95" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Step 6: FastAPI & React */}
            <g transform="translate(810, 40)">
              <rect width="105" height="110" rx="8" fill="#18181b" stroke="#4ade80" strokeWidth="1.5" />
              <text x="52" y="32" fill="#4ade80" fontSize="12" fontWeight="bold" textAnchor="middle">6. Web Client</text>
              <text x="52" y="55" fill="#e4e4e7" fontSize="11" textAnchor="middle">FastAPI (8000)</text>
              <text x="52" y="75" fill="#a1a1aa" fontSize="10" textAnchor="middle">React 19 Dashboard</text>
              <text x="52" y="95" fill="#71717a" fontSize="9" textAnchor="middle">Apache ECharts</text>
            </g>
          </svg>
        </Box>

        {/* Step-by-Step Breakdown Cards */}
        <VStack align="stretch" gap={3} pt={2}>
          {PIPELINE_STEPS.map((step) => (
            <Box key={step.stepNumber} bg="gray.950" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.800">
              <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} gap={2} mb={1}>
                <HStack gap={2}>
                  <Badge colorPalette="orange" variant="solid" size="xs">
                    Step {step.stepNumber}
                  </Badge>
                  <Text fontSize="sm" fontWeight="bold" color="gray.100">
                    {step.title}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  {step.system}
                </Text>
              </Flex>
              <Text fontSize="xs" color="gray.300" mb={1} lineHeight="1.6">
                {step.description}
              </Text>
              <Text fontSize="xs" color="gray.400" lineHeight="1.6">
                {step.details}
              </Text>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
}
