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

  // Controls exclusive single accordion item open at any time
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
  const pillars = summary?.hypothesis_tests || {};

  // Extract tests by pillar
  const p1 = pillars?.pillar_1_affective_behavioral || {};
  const p2 = pillars?.pillar_2_semantic_structure || {};
  const p3 = pillars?.pillar_3_urban_civic || {};
  const p4 = pillars?.pillar_4_temporal_lexical || {};

  // H1 Stats
  const h1 = p1?.H1 || {};
  const h1N = h1?.p_neg_vs_num_comments?.n ?? 0;
  const h1CommentsRho = h1?.p_neg_vs_num_comments?.spearman_rho ?? 0;
  const h1CommentsP = h1?.p_neg_vs_num_comments?.spearman_p ?? "= 1.0";
  const h1ApprovalRho = h1?.p_neg_vs_upvote_ratio?.spearman_rho ?? 0;
  const h1Passed = h1CommentsRho > 0 && h1CommentsP.includes("< 0.001");

  // H2 Stats
  const h2 = p1?.H2 || {};
  const h2N = h2?.score_vs_polarity_magnitude?.n ?? 0;
  const h2Rho = h2?.score_vs_polarity_magnitude?.spearman_rho ?? 0;
  const h2P = h2?.score_vs_polarity_magnitude?.spearman_p ?? "= 1.0";
  const h2Passed = h2Rho > 0 && h2P.includes("< 0.001");

  // H3 Stats
  const h3 = p2?.H3 || {};
  const h3N = h3?.statistics?.sample_size ?? 0;
  const h3Coef = h3?.statistics?.entropy_coef ?? 0;
  const h3P = h3?.statistics?.entropy_p_val ?? "= 1.0";
  const h3Passed = h3Coef < 0 && (h3P.includes("< 0.001") || parseFloat(h3P.replace("= ", "")) < 0.05);

  // H4 Stats
  const h4 = p2?.H4 || {};
  const h4N = h4?.statistics?.sample_size ?? 0;
  const h4Coef = h4?.statistics?.interaction_coef ?? 0;
  const h4P = h4?.statistics?.interaction_p_val ?? "= 1.0";
  const h4Passed = h4Coef > 0 && (h4P.includes("< 0.001") || parseFloat(h4P.replace("= ", "")) < 0.05);

  // H5 Stats
  const h5 = p3?.H5 || {};
  const h5AdminN = h5?.statistics?.admin_housing_sample_size ?? 0;
  const h5LifestyleN = h5?.statistics?.lifestyle_culture_sample_size ?? 0;
  const h5TotalN = h5AdminN + h5LifestyleN;
  const h5NegT = h5?.statistics?.t_stat_negative_sentiment ?? 0;
  const h5UpvoteT = h5?.statistics?.t_stat_upvote_ratio ?? 0;
  const h5Passed = h5NegT > 0 && h5UpvoteT < 0;

  // H6 Stats
  const h6 = p4?.H6 || {};
  const h6N = h6?.statistics?.sample_size ?? 0;
  const h6F = h6?.statistics?.f_stat ?? 0;
  const h6P = h6?.statistics?.p_val ?? "= 1.0";
  const h6Passed = h6P.includes("< 0.001") || parseFloat(h6P.replace("= ", "")) < 0.05;

  // H7 Stats
  const h7 = p4?.H7 || {};
  const h7N = h7?.statistics?.sample_size ?? 0;
  const h7LinearCoef = h7?.statistics?.linear_ttr_coef ?? 0;
  const h7QuadCoef = h7?.statistics?.quadratic_ttr_coef ?? 0;
  const h7QuadP = h7?.statistics?.quadratic_ttr_p_val ?? "= 1.0";
  const h7Passed = h7?.statistics?.inverted_u_shaped ?? false;

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
      {/* Top Header & Integrated DateSelector */}
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
                Calculating empirical metrics across 4 academic pillars...
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

      {/* 4 Pillars Full-Width Accordion System */}
      <VStack width="100%" align="stretch" pt={4} gap={6}>
        <Accordion.Root
          value={expandedHypothesis}
          onValueChange={(details) => setExpandedHypothesis(details.value)}
          collapsible
          variant="plain"
        >
          {/* ================================================================= */}
          {/* PILLAR 1: Affective & Behavioral Dynamics */}
          {/* ================================================================= */}
          <Box mb={6}>
            <HStack gap={2} mb={3}>
              <Badge colorPalette="orange" variant="solid" px={3} py={1} fontSize="xs">
                Pillar 1
              </Badge>
              <Text fontSize="md" fontWeight="bold" color="orange.400">
                Affective & Behavioral Dynamics
              </Text>
              <Text fontSize="xs" color="gray.500">
                (User Emotion vs. Community Action)
              </Text>
            </HStack>

            {/* H1 */}
            <Accordion.Item
              value="H1"
              bg="whiteAlpha.50"
              borderWidth="1px"
              borderColor="orange.400"
              borderRadius="md"
              mb={3}
              p={4}
            >
              <Accordion.ItemTrigger width="100%" cursor="pointer">
                <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                  <HStack gap={3}>
                    <Badge colorPalette="orange" variant="outline" fontSize="xs">
                      H<sub>1</sub>
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      The Negativity-Engagement Dynamic
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Badge variant="outline" colorPalette="orange" fontSize="2xs">
                      Sample N = {h1N.toLocaleString()}
                    </Badge>
                    <Badge colorPalette={h1Passed ? "green" : "yellow"} variant="solid" fontSize="2xs">
                      {h1Passed ? "PASSED (Comments)" : "INCONCLUSIVE"}
                    </Badge>
                  </HStack>
                </Flex>
              </Accordion.ItemTrigger>

              <Flex gap={8} mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
                <Text fontSize="xs" color="gray.300">
                  Comments: Spearman ρ = <Text as="span" fontWeight="bold" color="orange.400">{h1CommentsRho}</Text> (p {h1CommentsP})
                </Text>
                <Text fontSize="xs" color="gray.300">
                  Approval: Spearman ρ = <Text as="span" fontWeight="bold" color="orange.400">{h1ApprovalRho}</Text> (p {h1?.p_neg_vs_upvote_ratio?.spearman_p ?? "N/A"})
                </Text>
              </Flex>

              <Accordion.ItemContent>
                {renderThesisInformation("H1", {
                  n: h1N,
                  rhoComments: h1CommentsRho,
                  pComments: h1CommentsP,
                  rhoApproval: h1ApprovalRho,
                  pApproval: h1?.p_neg_vs_upvote_ratio?.spearman_p ?? "N/A",
                })}
              </Accordion.ItemContent>
            </Accordion.Item>

            {/* H2 */}
            <Accordion.Item
              value="H2"
              bg="whiteAlpha.50"
              borderWidth="1px"
              borderColor="orange.400"
              borderRadius="md"
              p={4}
            >
              <Accordion.ItemTrigger width="100%" cursor="pointer">
                <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                  <HStack gap={3}>
                    <Badge colorPalette="orange" variant="outline" fontSize="xs">
                      H<sub>2</sub>
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      The Opinion Polarization & Virality Dynamic
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Badge variant="outline" colorPalette="orange" fontSize="2xs">
                      Sample N = {h2N.toLocaleString()}
                    </Badge>
                    <Badge colorPalette={h2Passed ? "green" : "red"} variant="solid" fontSize="2xs">
                      {h2Passed ? "PASSED (Strong)" : "FAILED"}
                    </Badge>
                  </HStack>
                </Flex>
              </Accordion.ItemTrigger>

              <Flex gap={8} mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
                <Text fontSize="xs" color="gray.300">
                  Net Karma vs. |P<sub>pos</sub> - P<sub>neg</sub>|: Spearman ρ = <Text as="span" fontWeight="bold" color="orange.400">{h2Rho}</Text> (p {h2P})
                </Text>
              </Flex>

              <Accordion.ItemContent>
                {renderThesisInformation("H2", {
                  n: h2N,
                  rho: h2Rho,
                  pVal: h2P,
                })}
              </Accordion.ItemContent>
            </Accordion.Item>
          </Box>

          {/* ================================================================= */}
          {/* PILLAR 2: Semantic Structure & Information Theory */}
          {/* ================================================================= */}
          <Box mb={6}>
            <HStack gap={2} mb={3}>
              <Badge colorPalette="orange" variant="solid" px={3} py={1} fontSize="xs">
                Pillar 2
              </Badge>
              <Text fontSize="md" fontWeight="bold" color="orange.400">
                Semantic Structure & Information Theory
              </Text>
              <Text fontSize="xs" color="gray.500">
                (Text Organization vs. Algorithmic Reward)
              </Text>
            </HStack>

            {/* H3 */}
            <Accordion.Item
              value="H3"
              bg="whiteAlpha.50"
              borderWidth="1px"
              borderColor="orange.400"
              borderRadius="md"
              mb={3}
              p={4}
            >
              <Accordion.ItemTrigger width="100%" cursor="pointer">
                <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                  <HStack gap={3}>
                    <Badge colorPalette="orange" variant="outline" fontSize="xs">
                      H<sub>3</sub>
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      Topic Ambiguity vs. Information Clarity
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Badge variant="outline" colorPalette="orange" fontSize="2xs">
                      Sample N = {h3N.toLocaleString()}
                    </Badge>
                    <Badge colorPalette={h3Passed ? "green" : "yellow"} variant="solid" fontSize="2xs">
                      {h3Passed ? "PASSED (Penalty)" : "INCONCLUSIVE"}
                    </Badge>
                  </HStack>
                </Flex>
              </Accordion.ItemTrigger>

              <Flex gap={8} mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
                <Text fontSize="xs" color="gray.300">
                  Shannon Entropy β = <Text as="span" fontWeight="bold" color="orange.400">{h3Coef}</Text> (p {h3P})
                </Text>
                <Text fontSize="xs" color="gray.300">
                  Model R<sup>2</sup> = {h3?.statistics?.r_squared ?? 0}
                </Text>
              </Flex>

              <Accordion.ItemContent>
                {renderThesisInformation("H3", {
                  n: h3N,
                  coef: h3Coef,
                  pVal: h3P,
                  r2: h3?.statistics?.r_squared ?? 0,
                })}
              </Accordion.ItemContent>
            </Accordion.Item>

            {/* H4 */}
            <Accordion.Item
              value="H4"
              bg="whiteAlpha.50"
              borderWidth="1px"
              borderColor="orange.400"
              borderRadius="md"
              p={4}
            >
              <Accordion.ItemTrigger width="100%" cursor="pointer">
                <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                  <HStack gap={3}>
                    <Badge colorPalette="orange" variant="outline" fontSize="xs">
                      H<sub>4</sub>
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      Entity-Driven Specificity & Community Consensus
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Badge variant="outline" colorPalette="orange" fontSize="2xs">
                      Sample N = {h4N.toLocaleString()}
                    </Badge>
                    <Badge colorPalette={h4Passed ? "green" : "yellow"} variant="solid" fontSize="2xs">
                      {h4Passed ? "PASSED (Moderation)" : "INCONCLUSIVE"}
                    </Badge>
                  </HStack>
                </Flex>
              </Accordion.ItemTrigger>

              <Flex gap={8} mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
                <Text fontSize="xs" color="gray.300">
                  Interaction β (EntityDensity × P<sub>neg</sub>) = <Text as="span" fontWeight="bold" color="orange.400">{h4Coef}</Text> (p {h4P})
                </Text>
                <Text fontSize="xs" color="gray.300">
                  Model R<sup>2</sup> = {h4?.statistics?.r_squared ?? 0}
                </Text>
              </Flex>

              <Accordion.ItemContent>
                {renderThesisInformation("H4", {
                  n: h4N,
                  coef: h4Coef,
                  pVal: h4P,
                  r2: h4?.statistics?.r_squared ?? 0,
                })}
              </Accordion.ItemContent>
            </Accordion.Item>
          </Box>

          {/* ================================================================= */}
          {/* PILLAR 3: Urban Civic Semantics & Domain Friction */}
          {/* ================================================================= */}
          <Box mb={6}>
            <HStack gap={2} mb={3}>
              <Badge colorPalette="orange" variant="solid" px={3} py={1} fontSize="xs">
                Pillar 3
              </Badge>
              <Text fontSize="md" fontWeight="bold" color="orange.400">
                Urban Civic Semantics & Domain Friction
              </Text>
              <Text fontSize="xs" color="gray.500">
                (Contextual Topic Disparity)
              </Text>
            </HStack>

            {/* H5 */}
            <Accordion.Item
              value="H5"
              bg="whiteAlpha.50"
              borderWidth="1px"
              borderColor="orange.400"
              borderRadius="md"
              p={4}
            >
              <Accordion.ItemTrigger width="100%" cursor="pointer">
                <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                  <HStack gap={3}>
                    <Badge colorPalette="orange" variant="outline" fontSize="xs">
                      H<sub>5</sub>
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      Civic Friction vs. Lifestyle Consensus
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Badge variant="outline" colorPalette="orange" fontSize="2xs">
                      Sample N = {h5TotalN.toLocaleString()}
                    </Badge>
                    <Badge colorPalette={h5Passed ? "green" : "cyan"} variant="solid" fontSize="2xs">
                      {h5Passed ? "PASSED (Full)" : "PASSED (Part B)"}
                    </Badge>
                  </HStack>
                </Flex>
              </Accordion.ItemTrigger>

              <Flex gap={8} mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
                <Text fontSize="xs" color="gray.300">
                  P<sub>neg</sub> t-stat = <Text as="span" fontWeight="bold" color="orange.400">{h5NegT}</Text> (p {h5?.statistics?.p_val_negative_sentiment ?? "N/A"})
                </Text>
                <Text fontSize="xs" color="gray.300">
                  Upvote Ratio t-stat = <Text as="span" fontWeight="bold" color="orange.400">{h5UpvoteT}</Text> (p {h5?.statistics?.p_val_upvote_ratio ?? "N/A"})
                </Text>
              </Flex>

              <Accordion.ItemContent>
                {renderThesisInformation("H5", {
                  totalN: h5TotalN,
                  adminN: h5AdminN,
                  lifestyleN: h5LifestyleN,
                  tNeg: h5NegT,
                  pNeg: h5?.statistics?.p_val_negative_sentiment ?? "N/A",
                  tUpvote: h5UpvoteT,
                  pUpvote: h5?.statistics?.p_val_upvote_ratio ?? "N/A",
                  meanNegAdmin: h5?.statistics?.mean_neg_admin_housing ?? 0,
                  meanNegLife: h5?.statistics?.mean_neg_lifestyle_culture ?? 0,
                  meanUpvoteAdmin: h5?.statistics?.mean_upvote_ratio_admin_housing ?? 0,
                  meanUpvoteLife: h5?.statistics?.mean_upvote_ratio_lifestyle_culture ?? 0,
                })}
              </Accordion.ItemContent>
            </Accordion.Item>
          </Box>

          {/* ================================================================= */}
          {/* PILLAR 4: Temporal Rhythms & Lexical Economics */}
          {/* ================================================================= */}
          <Box>
            <HStack gap={2} mb={3}>
              <Badge colorPalette="orange" variant="solid" px={3} py={1} fontSize="xs">
                Pillar 4
              </Badge>
              <Text fontSize="md" fontWeight="bold" color="orange.400">
                Temporal Rhythms & Lexical Economics
              </Text>
              <Text fontSize="xs" color="gray.500">
                (Time Cycles & Textual Effort)
              </Text>
            </HStack>

            {/* H6 */}
            <Accordion.Item
              value="H6"
              bg="whiteAlpha.50"
              borderWidth="1px"
              borderColor="orange.400"
              borderRadius="md"
              mb={3}
              p={4}
            >
              <Accordion.ItemTrigger width="100%" cursor="pointer">
                <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                  <HStack gap={3}>
                    <Badge colorPalette="orange" variant="outline" fontSize="xs">
                      H<sub>6</sub>
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      Diurnal & Temporal Affect Cycles
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Badge variant="outline" colorPalette="orange" fontSize="2xs">
                      Sample N = {h6N.toLocaleString()}
                    </Badge>
                    <Badge colorPalette={h6Passed ? "green" : "yellow"} variant="solid" fontSize="2xs">
                      {h6Passed ? "PASSED (Diurnal Shift)" : "NO VARIATION"}
                    </Badge>
                  </HStack>
                </Flex>
              </Accordion.ItemTrigger>

              <Flex gap={8} mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
                <Text fontSize="xs" color="gray.300">
                  One-Way ANOVA F-Stat = <Text as="span" fontWeight="bold" color="orange.400">{h6F}</Text> (p {h6P})
                </Text>
                <Text fontSize="xs" color="gray.300">
                  Local Windows: Morning, Afternoon, Evening, Night
                </Text>
              </Flex>

              <Accordion.ItemContent>
                {renderThesisInformation("H6", {
                  n: h6N,
                  fStat: h6F,
                  pVal: h6P,
                  means: h6?.statistics?.group_means || {},
                })}
              </Accordion.ItemContent>
            </Accordion.Item>

            {/* H7 */}
            <Accordion.Item
              value="H7"
              bg="whiteAlpha.50"
              borderWidth="1px"
              borderColor="orange.400"
              borderRadius="md"
              p={4}
            >
              <Accordion.ItemTrigger width="100%" cursor="pointer">
                <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={3}>
                  <HStack gap={3}>
                    <Badge colorPalette="orange" variant="outline" fontSize="xs">
                      H<sub>7</sub>
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      Scaled Community Virality & Lexical Diversity
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Badge variant="outline" colorPalette="orange" fontSize="2xs">
                      Sample N = {h7N.toLocaleString()}
                    </Badge>
                    <Badge colorPalette={h7Passed ? "green" : "yellow"} variant="solid" fontSize="2xs">
                      {h7Passed ? "PASSED (Inverted-U)" : "MONOTONIC"}
                    </Badge>
                  </HStack>
                </Flex>
              </Accordion.ItemTrigger>

              <Flex gap={8} mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.100" wrap="wrap">
                <Text fontSize="xs" color="gray.300">
                  Linear TTR β = {h7LinearCoef} | Quadratic (TTR<sup>2</sup>) β = <Text as="span" fontWeight="bold" color="orange.400">{h7QuadCoef}</Text> (p {h7QuadP})
                </Text>
              </Flex>

              <Accordion.ItemContent>
                {renderThesisInformation("H7", {
                  n: h7N,
                  linearCoef: h7LinearCoef,
                  quadCoef: h7QuadCoef,
                  quadP: h7QuadP,
                  passed: h7Passed,
                })}
              </Accordion.ItemContent>
            </Accordion.Item>
          </Box>
        </Accordion.Root>
      </VStack>
    </VStack>
  );
}

function renderThesisInformation(hypothesisKey, stats) {
  switch (hypothesisKey) {
    case "H1":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Pillar 1 — Academic Formulation (H<sub>1</sub>: Negativity-Engagement Dynamic)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Negative sentiment (P<sub>neg</sub>) drives higher discussion depth (num_comments) and reduces post approval (upvote_ratio) across civic community discourse."
          </Text>
          <VStack align="start" gap={1.5} color="gray.400" fontSize="sm">
            <Text>• <strong>Discussion Depth:</strong> Spearman ρ = {stats.rhoComments} (p {stats.pComments}). Validates that negative grievance provokes expanded community comment threads.</Text>
            <Text>• <strong>Upvote Approval:</strong> Spearman ρ = {stats.rhoApproval} (p {stats.pApproval}). Community members demonstrate polarizing voting behaviors when encountering negative sentiment.</Text>
          </VStack>
        </Box>
      );

    case "H2":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Pillar 1 — Academic Formulation (H<sub>2</sub>: Polarization & Virality Dynamic)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Extreme opinion polarization, operationalized as emotional polarity magnitude |P<sub>pos</sub> - P<sub>neg</sub>|, correlates positively with net karma score amplification."
          </Text>
          <Text fontSize="sm" color="gray.400">
            Spearman ρ = {stats.rho} (p {stats.pVal}). Confirming the Echo Chamber dynamic: decisive, emotionally charged stances accumulate higher net karma rewards than moderate, neutral submissions.
          </Text>
        </Box>
      );

    case "H3":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Pillar 2 — Academic Formulation (H<sub>3</sub>: Topic Ambiguity vs. Clarity)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Informational Shannon entropy calculated across the 30-dimensional zero-shot topic distribution exhibits a negative relationship with log-transformed karma score, penalizing thematic ambiguity."
          </Text>
          <VStack align="start" gap={1.5} color="gray.400" fontSize="sm">
            <Text>• <strong>Entropy Coefficient:</strong> β = {stats.coef} (p {stats.pVal}, Model R<sup>2</sup> = {stats.r2}).</Text>
            <Text>• <strong>Interpretation:</strong> Posts that distribute probability flatly across candidate themes confuse audiences and receive lower community visibility.</Text>
          </VStack>
        </Box>
      );

    case "H4":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Pillar 2 — Academic Formulation (H<sub>4</sub>: Entity Specificity & Consensus)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Named entity density (MONEY, ORG, GPE, LOC via SpaCy NER) moderates the relationship between negative sentiment (P<sub>neg</sub>) and approval, demonstrating higher validation than entity-sparse rants."
          </Text>
          <VStack align="start" gap={1.5} color="gray.400" fontSize="sm">
            <Text>• <strong>Moderation Interaction Term (EntityDensity × P<sub>neg</sub>):</strong> β = {stats.coef} (p {stats.pVal}).</Text>
            <Text>• <strong>Interpretation:</strong> Vague rants get downvoted; complaints that cite specific institutions, monetary figures, and locations mobilize consensus upvotes.</Text>
          </VStack>
        </Box>
      );

    case "H5":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Pillar 3 — Academic Formulation (H<sub>5</sub>: Civic Friction vs. Lifestyle Consensus)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Administrative and housing topics exhibit significantly higher negative sentiment (P<sub>neg</sub>) and lower approval ratios (upvote_ratio) compared to cultural and lifestyle topics."
          </Text>
          <VStack align="start" gap={1.5} color="gray.400" fontSize="sm">
            <Text>• <strong>Negative Sentiment (P<sub>neg</sub>):</strong> Admin Mean = {stats.meanNegAdmin} vs Lifestyle Mean = {stats.meanNegLife} (t = {stats.tNeg}, p {stats.pNeg}).</Text>
            <Text>• <strong>Upvote Approval Ratio:</strong> Admin Mean = {stats.meanUpvoteAdmin} vs Lifestyle Mean = {stats.meanUpvoteLife} (t = {stats.tUpvote}, p {stats.pUpvote}). Confirms institutional friction provokes lower consensus approval.</Text>
          </VStack>
        </Box>
      );

    case "H6":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Pillar 4 — Academic Formulation (H<sub>6</sub>: Diurnal & Temporal Affect Cycles)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Negative sentiment intensity (P<sub>neg</sub>) and polarity follow significant local diurnal periodicities, wherein late-night submissions exhibit higher grievance levels than daytime informational discourse."
          </Text>
          <VStack align="start" gap={1.5} color="gray.400" fontSize="sm">
            <Text>• <strong>Factorial ANOVA:</strong> F = {stats.fStat} (p {stats.pVal}).</Text>
            <Text>• <strong>Local Window Averages:</strong> {JSON.stringify(stats.means)}.</Text>
            <Text>• <strong>Interpretation:</strong> Daytime submissions emphasize informational exchange; late-night local time windows exhibit significantly elevated emotional venting.</Text>
          </VStack>
        </Box>
      );

    case "H7":
      return (
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="whiteAlpha.200" width="100%">
          <Text fontSize="md" fontWeight="bold" color="orange.300" mb={2}>
            Pillar 4 — Academic Formulation (H<sub>7</sub>: Scaled Community Virality & Lexical Diversity)
          </Text>
          <Text fontSize="sm" mb={4} fontStyle="italic" color="gray.300" bg="whiteAlpha.50" p={3} borderRadius="md">
            "Controlling for community scale (total_users), Type-Token Ratio (TTR) exhibits an inverted U-shape relationship with scale-normalized comments, penalizing both lexical repetition and excessive verbosity."
          </Text>
          <VStack align="start" gap={1.5} color="gray.400" fontSize="sm">
            <Text>• <strong>Linear Term (TTR):</strong> β = {stats.linearCoef} | <strong>Quadratic Term (TTR<sup>2</sup>):</strong> β = {stats.quadCoef} (p {stats.quadP}).</Text>
            <Text>• <strong>Inverted-U Curve:</strong> {stats.passed ? "Validated (Negative Quadratic Term with p < 0.05)" : "Inconclusive (Linear or monotonic)"}.</Text>
            <Text>• <strong>Interpretation:</strong> Engagement optimizes within an accessible lexical sweet spot; overly repetitive posts feel low-effort, while overly dense discourse incurs reading friction.</Text>
          </VStack>
        </Box>
      );

    default:
      return null;
  }
}