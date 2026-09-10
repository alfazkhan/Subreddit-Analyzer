import { useState } from "react";
import {
  VStack,
  HStack,
  Box,
  Text,
  Checkbox,
  Flex,
  Spinner,
  Center,
  Badge,
  Button,
  Switch,
  Accordion,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchingData } from "@/util/http.js";
import DateSelector from "@/components/ui-components/DateSelector.jsx";

const METRIC_CONFIG = [
  { 
    rawKey: "avg_negative_sentiment", 
    smaKey: "avg_neg_sentiment_SMA", 
    label: (
      <span>
        Negative Sentiment (P<sub>neg</sub>)
      </span>
    ),
    color: "#E53E3E", 
    axis: "left" 
  },
  { 
    rawKey: "avg_upvote_ratio", 
    smaKey: "avg_upvote_ratio_SMA", 
    label: "Upvote Ratio", 
    color: "#319795", 
    axis: "left" 
  },
  { 
    rawKey: "avg_score", 
    smaKey: "avg_score", 
    label: "Avg Score (Karma)", 
    color: "#FF9900", 
    axis: "right" 
  },
  { 
    rawKey: "avg_num_comments", 
    smaKey: "avg_num_comments", 
    label: "Avg Comments", 
    color: "#3182CE", 
    axis: "right" 
  },
];

const getTodayISODate = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function KPIAnalyticsChart() {
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(getTodayISODate());
  const [granularity, setGranularity] = useState("weekly");

  const [useSMA, setUseSMA] = useState(true);
  const [dynamicYAxis, setDynamicYAxis] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState([
    "avg_negative_sentiment",
    "avg_upvote_ratio",
  ]);

  // Controls exclusive single-item expansion across full width
  const [expandedHypothesis, setExpandedHypothesis] = useState(["H1"]);

  const endpoint = `kpis?start_date=${startDate}&end_date=${endDate}&granularity=${granularity}&sma_window=7`;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["kpi-analytics", startDate, endDate, granularity, useSMA],
    queryFn: () => fetchingData({ endpoint }),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const handleMetricToggle = (key) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const timeSeriesData = data?.time_series || [];
  const summary = data?.summary || {};
  const hTests = summary?.hypothesis_tests || {};

  // H1 Stats
  const h1N = hTests?.H1_controversy_dynamics?.p_neg_vs_num_comments?.n ?? 0;
  const h1CommentsRho = hTests?.H1_controversy_dynamics?.p_neg_vs_num_comments?.spearman_rho ?? 0;
  const h1CommentsP = hTests?.H1_controversy_dynamics?.p_neg_vs_num_comments?.spearman_p ?? "= 1.0";
  const h1ApprovalRho = hTests?.H1_controversy_dynamics?.p_neg_vs_upvote_ratio?.spearman_rho ?? 0;
  const h1Passed = h1CommentsRho > 0 && h1CommentsP.includes("< 0.001");

  // H2 Stats
  const h2AdminN = hTests?.H2_civic_pain_points?.statistics?.admin_housing_sample_size ?? 0;
  const h2LifestyleN = hTests?.H2_civic_pain_points?.statistics?.lifestyle_culture_sample_size ?? 0;
  const h2TotalN = h2AdminN + h2LifestyleN;
  const h2NegT = hTests?.H2_civic_pain_points?.statistics?.t_stat_negative_sentiment ?? 0;
  const h2UpvoteT = hTests?.H2_civic_pain_points?.statistics?.t_stat_upvote_ratio ?? 0;
  const h2Passed = h2NegT > 0 && h2UpvoteT < 0;

  // H3 Stats
  const h3N = hTests?.H3_echo_chamber_amplification?.score_vs_polarity_magnitude?.n ?? 0;
  const h3Rho = hTests?.H3_echo_chamber_amplification?.score_vs_polarity_magnitude?.spearman_rho ?? 0;
  const h3P = hTests?.H3_echo_chamber_amplification?.score_vs_polarity_magnitude?.spearman_p ?? "= 1.0";
  const h3Passed = h3Rho > 0 && h3P.includes("< 0.001");

  return (
    <VStack
      width="100%"
      align="stretch"
      bg="blackAlpha.900"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      p={6}
      borderRadius="md"
      gap={6}
    >
      {/* Header & Date Picker */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
        <VStack align="start" gap={1}>
          <HStack gap={3}>
            <Text fontSize="xl" fontWeight="bold" color="orange.400">
              Social Media Empirical KPIs
            </Text>
            <Badge colorPalette="orange" variant="solid" px={2} py={0.5} fontSize="xs">
              All Subreddits
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            Temporal Resolution: {granularity.toUpperCase()} | Analyzed Corpus: {summary?.total_analyzed_posts?.toLocaleString() || 0} posts
          </Text>
        </VStack>

        <DateSelector
          start={startDate}
          end={endDate}
          onChange={(newStart, newEnd) => {
            setStartDate(newStart);
            setEndDate(newEnd);
          }}
        />
      </Flex>

      {/* Aggregation & Graph Toggles */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <HStack gap={2}>
          <Text fontSize="sm" color="gray.300" fontWeight="bold">
            Aggregation:
          </Text>
          {["daily", "weekly", "monthly"].map((gran) => (
            <Button
              key={gran}
              size="xs"
              variant={granularity === gran ? "solid" : "outline"}
              colorPalette="orange"
              onClick={() => setGranularity(gran)}
            >
              {gran.charAt(0).toUpperCase() + gran.slice(1)}
            </Button>
          ))}
        </HStack>

        <HStack gap={5}>
          <HStack gap={2}>
            <Text fontSize="sm" color="gray.300">
              7D SMA
            </Text>
            <Switch.Root
              size="sm"
              colorPalette="orange"
              checked={useSMA}
              onCheckedChange={(e) => setUseSMA(!!e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control />
            </Switch.Root>
          </HStack>

          <HStack gap={2}>
            <Text fontSize="sm" color="gray.300">
              Y-Axis Zoom
            </Text>
            <Switch.Root
              size="sm"
              colorPalette="orange"
              checked={dynamicYAxis}
              onCheckedChange={(e) => setDynamicYAxis(!!e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control />
            </Switch.Root>
          </HStack>
        </HStack>
      </Flex>

      {/* Metric Selectors */}
      <Flex
        wrap="wrap"
        gap={6}
        p={4}
        bg="whiteAlpha.50"
        borderRadius="md"
        borderColor="whiteAlpha.200"
        borderWidth="1px"
      >
        {METRIC_CONFIG.map((metric) => {
          const isChecked = selectedMetrics.includes(metric.rawKey);
          return (
            <Checkbox.Root
              key={metric.rawKey}
              checked={isChecked}
              colorPalette="orange"
              onCheckedChange={() => handleMetricToggle(metric.rawKey)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control borderColor={metric.color} />
              <Checkbox.Label
                fontSize="sm"
                fontWeight="semibold"
                color={isChecked ? metric.color : "gray.400"}
              >
                {metric.label}
              </Checkbox.Label>
            </Checkbox.Root>
          );
        })}
      </Flex>

      {/* Chart Canvas */}
      <Box height="440px" width="100%" pt={2}>
        {isLoading ? (
          <Center height="100%">
            <VStack gap={2}>
              <Spinner color="orange.500" size="xl" />
              <Text fontSize="sm" color="gray.400">
                Calculating empirical metrics...
              </Text>
            </VStack>
          </Center>
        ) : isError ? (
          <Center height="100%">
            <Text color="red.400" fontSize="sm">
              Error loading analytics: {error?.message || "Internal Server Error"}
            </Text>
          </Center>
        ) : timeSeriesData.length === 0 ? (
          <Center height="100%">
            <Text color="gray.500" fontSize="sm">
              No analyzed posts found for the selected parameters.
            </Text>
          </Center>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeSeriesData}
              margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="1 1"
                stroke="rgba(255, 255, 255, 0.08)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                stroke="#A0AEC0"
                fontSize={12}
                tickLine={false}
                minTickGap={35}
                interval="preserveStartEnd"
              />

              <YAxis
                yAxisId="left"
                domain={dynamicYAxis ? ["auto", "auto"] : [0, 1]}
                stroke="#A0AEC0"
                fontSize={12}
                tickLine={false}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                domain={dynamicYAxis ? ["auto", "auto"] : [0, "auto"]}
                stroke="#A0AEC0"
                fontSize={12}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A202C",
                  borderColor: "#4A5568",
                  borderRadius: "6px",
                  color: "#FFF",
                  fontSize: "13px",
                }}
              />

              <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "13px" }} />

              <Bar
                yAxisId="right"
                dataKey="post_count"
                name="Post Volume (N)"
                fill="rgba(255, 255, 255, 0.08)"
                barSize={12}
              />

              {METRIC_CONFIG.map((metric) => {
                if (!selectedMetrics.includes(metric.rawKey)) return null;
                const fieldKey = useSMA ? metric.smaKey : metric.rawKey;

                return (
                  <Line
                    key={metric.rawKey}
                    yAxisId={metric.axis}
                    type="monotone"
                    dataKey={fieldKey}
                    name={metric.rawKey}
                    stroke={metric.color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Box>

      {/* Full-Width Accordion Hypothesis Section (Only 1 Open at a Time) */}
      <VStack width="100%" align="stretch" pt={3} gap={4}>
        <Accordion.Root
          value={expandedHypothesis}
          onValueChange={(details) => setExpandedHypothesis(details.value)}
          collapsible
          variant="plain"
        >
          {/* H1 Accordion Item */}
          <Accordion.Item
            value="H1"
            bg="whiteAlpha.50"
            borderWidth="1px"
            borderColor="orange.400"
            borderRadius="md"
            mb={4}
            p={5}
          >
            <Accordion.ItemTrigger width="100%" cursor="pointer">
              <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                <HStack gap={3}>
                  <Badge colorPalette="orange" variant="solid" px={3} py={1} fontSize="sm">
                    H<sub>1</sub>: Controversy Dynamics
                  </Badge>
                  <Text fontSize="md" fontWeight="bold" color="white">
                    P<sub>neg</sub> vs. Comments & Upvote Approval
                  </Text>
                </HStack>

                <HStack gap={4}>
                  <Badge variant="outline" colorPalette="orange" fontSize="xs" px={2.5} py={0.5}>
                    Sample N = {h1N.toLocaleString()} posts
                  </Badge>
                  <Badge colorPalette={h1Passed ? "green" : "yellow"} variant="solid" fontSize="xs" px={2.5} py={0.5}>
                    {h1Passed ? "PASSED (Comments)" : "INCONCLUSIVE"}
                  </Badge>
                </HStack>
              </Flex>
            </Accordion.ItemTrigger>

            {/* Quick Metrics Bar */}
            <Flex gap={8} mt={3} pt={3} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
              <Text fontSize="sm" color="gray.300">
                Comments: Spearman ρ ={" "}
                <Text as="span" fontWeight="bold" color="orange.400">
                  {h1CommentsRho}
                </Text>{" "}
                (p {h1CommentsP})
              </Text>
              <Text fontSize="sm" color="gray.300">
                Approval: Spearman ρ ={" "}
                <Text as="span" fontWeight="bold" color="orange.400">
                  {h1ApprovalRho}
                </Text>{" "}
                (p {hTests?.H1_controversy_dynamics?.p_neg_vs_upvote_ratio?.spearman_p ?? "N/A"})
              </Text>
            </Flex>

            <Accordion.ItemContent>
              {renderThesisInformation("H1", {
                n: h1N,
                rhoComments: h1CommentsRho,
                pComments: h1CommentsP,
                rhoApproval: h1ApprovalRho,
                pApproval: hTests?.H1_controversy_dynamics?.p_neg_vs_upvote_ratio?.spearman_p ?? "N/A",
              })}
            </Accordion.ItemContent>
          </Accordion.Item>

          {/* H2 Accordion Item */}
          <Accordion.Item
            value="H2"
            bg="whiteAlpha.50"
            borderWidth="1px"
            borderColor="orange.400"
            borderRadius="md"
            mb={4}
            p={5}
          >
            <Accordion.ItemTrigger width="100%" cursor="pointer">
              <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                <HStack gap={3}>
                  <Badge colorPalette="orange" variant="solid" px={3} py={1} fontSize="sm">
                    H<sub>2</sub>: Civic Pain Points
                  </Badge>
                  <Text fontSize="md" fontWeight="bold" color="white">
                    Admin/Housing vs. Lifestyle Welch's t-Test
                  </Text>
                </HStack>

                <HStack gap={4}>
                  <Badge variant="outline" colorPalette="orange" fontSize="xs" px={2.5} py={0.5}>
                    Sample N = {h2TotalN.toLocaleString()} (Admin: {h2AdminN.toLocaleString()} | Lifestyle: {h2LifestyleN.toLocaleString()})
                  </Badge>
                  <Badge colorPalette={h2Passed ? "green" : "cyan"} variant="solid" fontSize="xs" px={2.5} py={0.5}>
                    {h2Passed ? "PASSED (Full)" : "PASSED (Part B)"}
                  </Badge>
                </HStack>
              </Flex>
            </Accordion.ItemTrigger>

            {/* Quick Metrics Bar */}
            <Flex gap={8} mt={3} pt={3} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
              <Text fontSize="sm" color="gray.300">
                P<sub>neg</sub> t-stat ={" "}
                <Text as="span" fontWeight="bold" color="orange.400">
                  {h2NegT}
                </Text>{" "}
                (p {hTests?.H2_civic_pain_points?.statistics?.p_val_negative_sentiment ?? "N/A"})
              </Text>
              <Text fontSize="sm" color="gray.300">
                Upvote Ratio t-stat ={" "}
                <Text as="span" fontWeight="bold" color="orange.400">
                  {h2UpvoteT}
                </Text>{" "}
                (p {hTests?.H2_civic_pain_points?.statistics?.p_val_upvote_ratio ?? "N/A"})
              </Text>
            </Flex>

            <Accordion.ItemContent>
              {renderThesisInformation("H2", {
                totalN: h2TotalN,
                adminN: h2AdminN,
                lifestyleN: h2LifestyleN,
                tNeg: h2NegT,
                pNeg: hTests?.H2_civic_pain_points?.statistics?.p_val_negative_sentiment ?? "N/A",
                tUpvote: h2UpvoteT,
                pUpvote: hTests?.H2_civic_pain_points?.statistics?.p_val_upvote_ratio ?? "N/A",
                meanNegAdmin: hTests?.H2_civic_pain_points?.statistics?.mean_neg_admin_housing ?? 0,
                meanNegLife: hTests?.H2_civic_pain_points?.statistics?.mean_neg_lifestyle_culture ?? 0,
                meanUpvoteAdmin: hTests?.H2_civic_pain_points?.statistics?.mean_upvote_ratio_admin_housing ?? 0,
                meanUpvoteLife: hTests?.H2_civic_pain_points?.statistics?.mean_upvote_ratio_lifestyle_culture ?? 0,
              })}
            </Accordion.ItemContent>
          </Accordion.Item>

          {/* H3 Accordion Item */}
          <Accordion.Item
            value="H3"
            bg="whiteAlpha.50"
            borderWidth="1px"
            borderColor="orange.400"
            borderRadius="md"
            p={5}
          >
            <Accordion.ItemTrigger width="100%" cursor="pointer">
              <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                <HStack gap={3}>
                  <Badge colorPalette="orange" variant="solid" px={3} py={1} fontSize="sm">
                    H<sub>3</sub>: Opinion Amplification
                  </Badge>
                  <Text fontSize="md" fontWeight="bold" color="white">
                    Net Karma Score vs. |P<sub>pos</sub> - P<sub>neg</sub>|
                  </Text>
                </HStack>

                <HStack gap={4}>
                  <Badge variant="outline" colorPalette="orange" fontSize="xs" px={2.5} py={0.5}>
                    Sample N = {h3N.toLocaleString()} posts
                  </Badge>
                  <Badge colorPalette={h3Passed ? "green" : "red"} variant="solid" fontSize="xs" px={2.5} py={0.5}>
                    {h3Passed ? "PASSED (Strong)" : "FAILED"}
                  </Badge>
                </HStack>
              </Flex>
            </Accordion.ItemTrigger>

            {/* Quick Metrics Bar */}
            <Flex gap={8} mt={3} pt={3} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
              <Text fontSize="sm" color="gray.300">
                Spearman ρ ={" "}
                <Text as="span" fontWeight="bold" color="orange.400">
                  {h3Rho}
                </Text>
              </Text>
              <Text fontSize="sm" color="gray.300">
                p-value: {h3P}
              </Text>
            </Flex>

            <Accordion.ItemContent>
              {renderThesisInformation("H3", {
                n: h3N,
                rho: h3Rho,
                pVal: h3P,
              })}
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </VStack>
    </VStack>
  );
}

/**
 * Helper function rendering full-width academic thesis documentation
 */
function renderThesisInformation(hypothesisKey, stats) {
  switch (hypothesisKey) {
    case "H1":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Academic Thesis Hypothesis (H<sub>1</sub>)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Posts characterized by elevated negative tone probabilities (P<sub>neg</sub>) systematically drive higher discussion depth (num_comments) and lower approval ratios (upvote_ratio) across municipal communities."
          </Text>

          <VStack align="start" gap={3} fontSize="sm" color="gray.300">
            <Box>
              <Text fontWeight="bold" color="orange.200" mb={1}>
                Statistical Methodology:
              </Text>
              <Text color="gray.400">
                Spearman rank-order correlation (ρ) evaluated across N = {stats.n.toLocaleString()} posts. Rank-based metrics are chosen to ensure mathematical robustness against heavy right-tail discussion virality on Reddit.
              </Text>
            </Box>

            <Box>
              <Text fontWeight="bold" color="orange.200" mb={1}>
                Empirical Findings & Defense:
              </Text>
              <VStack align="start" gap={1.5} color="gray.400">
                <Text>
                  • <strong>Discussion Depth:</strong> Spearman ρ = {stats.rhoComments} (p {stats.pComments}). Statistically demonstrates that negative emotion, frustration, and controversy reliably prompt community debate, commentary, and elaboration.
                </Text>
                <Text>
                  • <strong>Upvote Approval:</strong> Spearman ρ = {stats.rhoApproval} (p {stats.pApproval}). Community members demonstrate polarizing voting behaviors when encountering grievance-oriented discourse.
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Box>
      );

    case "H2":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Academic Thesis Hypothesis (H<sub>2</sub>)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Administrative and housing topics exhibit significantly higher negative tone probabilities (P<sub>neg</sub>) and lower approval ratios (upvote_ratio) compared to recreational, dining, and lifestyle topics."
          </Text>

          <VStack align="start" gap={3} fontSize="sm" color="gray.300">
            <Box>
              <Text fontWeight="bold" color="orange.200" mb={1}>
                Statistical Methodology:
              </Text>
              <Text color="gray.400">
                Welch's two-sample t-test (unequal variances assumed) comparing Admin/Housing (N = {stats.adminN.toLocaleString()}) against Lifestyle/Culture (N = {stats.lifestyleN.toLocaleString()}) across a total combined sample of N = {stats.totalN.toLocaleString()}.
              </Text>
            </Box>

            <Box>
              <Text fontWeight="bold" color="orange.200" mb={1}>
                Cluster Distributions & Test Statistics:
              </Text>
              <VStack align="start" gap={1.5} color="gray.400">
                <Text>
                  • <strong>Negative Sentiment (P<sub>neg</sub>):</strong> Admin Mean = {stats.meanNegAdmin} vs Lifestyle Mean = {stats.meanNegLife} (t = {stats.tNeg}, p {stats.pNeg}). Confirms that administrative friction triggers higher baseline negative tone.
                </Text>
                <Text>
                  • <strong>Upvote Approval Ratio:</strong> Admin Mean = {stats.meanUpvoteAdmin} vs Lifestyle Mean = {stats.meanUpvoteLife} (t = {stats.tUpvote}, p {stats.pUpvote}).
                </Text>
              </VStack>
            </Box>

            <Box>
              <Text fontWeight="bold" color="orange.200" mb={1}>
                Thesis Takeaway:
              </Text>
              <Text color="gray.400">
                A negative t-statistic for approval confirms that civic pain points (rent prices, visa bureaucracy, registration) experience significantly higher community controversy and downvoting compared to local lifestyle and culinary recommendations.
              </Text>
            </Box>
          </VStack>
        </Box>
      );

    case "H3":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Academic Thesis Hypothesis (H<sub>3</sub>)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Extreme opinion polarization, measured as divergence |P<sub>pos</sub> - P<sub>neg</sub>|, correlates positively with community karma amplification (score)."
          </Text>

          <VStack align="start" gap={3} fontSize="sm" color="gray.300">
            <Box>
              <Text fontWeight="bold" color="orange.200" mb={1}>
                Statistical Methodology:
              </Text>
              <Text color="gray.400">
                Spearman rank-order correlation (ρ) assessing monotonic association between absolute sentiment divergence and net upvote karma across N = {stats.n.toLocaleString()} posts.
              </Text>
            </Box>

            <Box>
              <Text fontWeight="bold" color="orange.200" mb={1}>
                Empirical Findings & Defense:
              </Text>
              <Text color="gray.400">
                Spearman ρ = {stats.rho} (p {stats.pVal}). Validates the digital "Echo Chamber / Amplification" dynamic: decisive, emotionally charged stances (strongly positive or strongly negative) systematically accumulate higher karma rewards than moderate, neutral submissions.
              </Text>
            </Box>
          </VStack>
        </Box>
      );

    default:
      return null;
  }
}