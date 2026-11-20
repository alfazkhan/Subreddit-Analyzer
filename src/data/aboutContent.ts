import type {
  GlossaryItem,
  PillarData,
  PipelineStep,
  PlatformTabScreenshot,
  TechStackCategory,
} from "@/util/Types";

// Configuration toggle: Supervisors appear only if true
export const SHOW_SUPERVISORS = false;

export const SUPERVISORS = [
  {
    name: "Prof. Dr. Andreas Widenhorn",
    role: "First Supervisor",
    institution: "International School of Management (ISM), Munich",
  },
  {
    name: "Prof. Dr. Patrick Schmid",
    role: "Second Supervisor",
    institution: "International School of Management (ISM), Munich",
  },
];

export const AUTHOR_FACTS = {
  name: "Alfaz Khan",
  degree: "MBA General Management",
  institution: "ISM International School of Management, Munich",
  thesisSubmission: "January 2027",
  links: {
    github: "https://github.com/alfazkhan/Subreddit-Analyzer",
    linkedin: "TODO_ALFAZ:",
    email: "khanalfaaz14@gmail.com",
  },
  bio: "Frontend developer who loves playing with data and figuring out the best way to get actionable insights from it.",
  whyIBuiltThis:
    "I had an idea what if we can use the reddit which has a highly moderate city subreddit and is a text based platform to find out more about the people of those cities and sentiments around different things.",
  h4RerunStatus:
    "TODO_ALFAZ: (planned / done / not planned) Hypothesis has insufficient data or methods for now to get a conclusive answer",
};

export const THESIS_METADATA = {
  title:
    "The Attention Economy of Digital Cities: An Empirical NLP Analysis of Emotion, Topic Clarity, and Civic Friction in Urban Social Streams",
  degree: "Master's Thesis Project, MBA General Management",
  institution: "International School of Management (ISM), Munich",
  submissionPeriod: "January 2027",
  snapshotDate: "November 2026",
  snapshotSampleSize: 51587,
  alphaLevel: 0.05,
  topicLabelCount: 30, // Verified from CANDIDATE_LABELS in Scraping/nlp_processor.py
  entropyBase: "natural logarithm (base e)", // Verified from calculate_shannon_entropy in Scraping/database/kpis.py
  normalizationMultiplier: 10000, // Verified from (num_comments / total_users) * 10000.0 in Scraping/database/kpis.py
};

export const THE_QUESTION = {
  paragraphs: [
    "Municipal and regional subreddits function as continuous, digital town squares for modern cities. On forums such as r/berlin, r/munich, r/nyc, r/london, and r/singapore, local residents, commuters, and newcomers report day-to-day administrative challenges, discuss rent increases, review transit lines, and share neighborhood safety warnings. Unlike short-form, algorithmic social feeds, these discussion boards host long-form, pseudonymous debates grounded in concrete urban geography.",
    "In any civic environment, attention is scarce. Which complaints get heard, which questions receive answers, and which topics dominate collective awareness depend heavily on community dynamics. Understanding the structural and emotional traits that drive post visibility and consensus voting offers direct insight into municipal priority-setting and civic friction.",
  ],
  researchQuestion:
    "How do emotional tone, topic structure, subject area, and posting time relate to the comments and approval a post receives in urban community discourse?",
};

export const THESIS_CONTEXT = {
  instrumentStatement:
    "The software platform built here is the research instrument. The interactive web dashboard demonstrates the pipeline in operation; the data collection, natural language models, and statistical tests form the empirical foundation of the thesis.",
  contributions: [
    {
      title: "Empirical baseline of municipal discourse",
      description:
        "Standardized measurements of sentiment, discussion volume, and topic friction across eleven major city subreddits, evaluating real community responses across 51,587 verified submissions.",
    },
    {
      title: "Probabilistic NLP measurement approach",
      description:
        "Applying continuous sentiment probabilities and informational Shannon entropy over multi-label zero-shot distributions, capturing subtle nuances rather than relying on discrete binary labels.",
    },
    {
      title: "Practical model for civic monitoring",
      description:
        "A reproducible architecture pairing headless browser extraction with a strict 7-day maturity buffer and local, self-hosted transformers for non-commercial urban research.",
    },
  ],
};

// Screenshots of the real dashboard tabs
export const PLATFORM_TABS: PlatformTabScreenshot[] = [
  {
    tabValue: "KPIs",
    tabLabel: "KPIs & Hypothesis Engine",
    imageSrc: "/src/assets/Screenshots/KPI-Analytics.png",
    caption:
      "Interactive dual-axis time series plotting post count, 7-day moving averages of negative sentiment and upvote ratio, alongside real-time hypothesis calculation panels.",
    altText: "Screenshot of the KPI Analytics dashboard showing time series charts and hypothesis metrics.",
  },
  {
    tabValue: "Sentiments",
    tabLabel: "Sentiment Distribution",
    imageSrc: "/src/assets/Screenshots/Sentiments.png",
    caption:
      "Cross-city and per-subreddit sentiment probability distributions broken down into positive, neutral, and negative classifications.",
    altText: "Screenshot of the Sentiments view displaying metric cards and category percentages.",
  },
  {
    tabValue: "WordCloud",
    tabLabel: "Lexical Word Cloud",
    imageSrc: "/src/assets/Screenshots/Keyword-Table.png",
    caption:
      "Visual frequency representation of extracted and lemmatized community vocabulary, filtered against dynamic municipal stopword blacklists.",
    altText: "Screenshot of extracted keywords showing frequency distributions across municipal discourse.",
  },
  {
    tabValue: "Pie Chart",
    tabLabel: "Keywords Donut & Pie Chart",
    imageSrc: "/src/assets/Screenshots/Pie-Chart.png",
    caption:
      "Apache ECharts breakdown of prominent civic keywords grouped by frequency and colored by their underlying emotional associations.",
    altText: "Screenshot of keyword distribution pie chart visualizer.",
  },
  {
    tabValue: "Posts Table",
    tabLabel: "Paginated Post Explorer",
    imageSrc: "/src/assets/Screenshots/Post-Table.png",
    caption:
      "Cursor-paginated table presenting individual submission records, verified scores, upvote ratios, sentiment vectors, and primary topics.",
    altText: "Screenshot of the paginated post table showing Reddit titles and NLP scores.",
  },
  {
    tabValue: "Keyword Table",
    tabLabel: "Keyword Frequency Table",
    imageSrc: "/src/assets/Screenshots/Keyword-Table.png",
    caption:
      "Tabular inventory of lemmatized tokens with frequency counts and user reporting actions to maintain stopword purity.",
    altText: "Screenshot of the keyword table with frequency numbers and filter options.",
  },
  {
    tabValue: "Posts Frequency",
    tabLabel: "24-Hour Post Activity",
    imageSrc: "/src/assets/Screenshots/Post-Frequency.png",
    caption:
      "Diurnal submission curve plotting activity volume by hour of day, synchronized to each city's local IANA timezone.",
    altText: "Screenshot of diurnal 24-hour activity bar chart.",
  },
  {
    tabValue: "Sentiments Frequency",
    tabLabel: "Circadian Affect Curves",
    imageSrc: "/src/assets/Screenshots/Sentiment-Frequency.png",
    caption:
      "Hourly emotion distribution tracking positive, neutral, and negative sentiment ratios throughout the 24-hour civic cycle in local solar time.",
    altText: "Screenshot of emotions throughout the day chart.",
  },
];

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    stepNumber: 1,
    title: "Reddit Municipal Feeds",
    system: "Target Subreddits",
    description: "Public regional communities representing eleven major cities.",
    details: "Monitored subreddits include Berlin, Munich, NYC, London, Amsterdam, Singapore, Toronto, Los Angeles, Mumbai, Delhi, and Hong Kong.",
  },
  {
    stepNumber: 2,
    title: "Headless Web Ingestion",
    system: "Playwright (scraper_v2.py)",
    description: "Automated Chromium browser sessions extract live submissions without relying on restricted API quotas.",
    details: "Parses DOM attributes from shreddit-post components to collect submission ID, timestamp, title, selftext, score, upvote ratio, and comment count.",
  },
  {
    stepNumber: 3,
    title: "7-Day Maturity Queue",
    system: "PostgreSQL Queue (run_worker.py)",
    description: "Enforces a mandatory one-week maturation delay before archival.",
    details: "Submissions remain pending until age exceeds 7 days, ensuring vote counts, debate threads, and moderator actions settle into steady state.",
  },
  {
    stepNumber: 4,
    title: "Relational Storage & Indexing",
    system: "PostgreSQL 15+ (reddit_posts)",
    description: "Stores enriched records with compound B-Tree cursor indexes and GIN inverted indexes.",
    details: "PostgreSQL LISTEN/NOTIFY broadcasts table mutations to real-time WebSocket feeds for administrative monitoring.",
  },
  {
    stepNumber: 5,
    title: "Local Offline Neural NLP",
    system: "Transformers & SpaCy (nlp_processor.py)",
    description: "Four offline analytical pipelines run locally on self-hosted hardware without external API calls.",
    details: "Computes 3-class sentiment (XLM-RoBERTa), 30-class zero-shot topic distribution (mDeBERTa-v3), named entities (SpaCy), and lemmatized keywords (NLTK).",
  },
  {
    stepNumber: 6,
    title: "Statistical API & Dashboard",
    system: "FastAPI & React 19 Client",
    description: "Asynchronous backend calculates moving averages and hypothesis regressions, served to a responsive Chakra UI v3 dashboard.",
    details: "Client utilizes TanStack Query v5 for caching and Apache ECharts for rendering interactive analytical charts.",
  },
];

export const DATA_METHOD_CONTENT = {
  maturityWindowExplanation:
    "Social media engagement metrics are notoriously volatile during the initial 24 to 72 hours following publication. Early votes swing rapidly, comment chains develop over multiple days, and community moderators remove rule-breaking posts. Ingesting records immediately introduces severe sampling error. This project enforces a strict 7-day maturity delay: a post is only archived once its age reaches at least seven full days, capturing metrics at steady-state community equilibrium.",
  storedFields: [
    { field: "Reddit Submission ID", detail: "Alphanumeric post identifier stripped of Reddit prefix" },
    { field: "Creation Timestamp", detail: "UTC timestamp converted to municipal local time during analysis" },
    { field: "Title & Body Text", detail: "Verbatim public text required for lexical and transformer NLP parsing" },
    { field: "Score (Net Karma)", detail: "Public balance of total upvotes minus downvotes" },
    { field: "Upvote Ratio", detail: "Ratio of positive community votes bounded between 0.0 and 1.0" },
    { field: "Number of Comments", detail: "Total stabilized discussion thread count" },
  ],
  deliberatelyExcludedFields: [
    "Reddit usernames and author profile handles",
    "Account biographies, karma history, and user avatars",
    "Internal Reddit user identifiers",
    "Private chat messages and moderator correspondence",
    "Nested comment tree bodies and replier identities",
  ],
  cleaningFilters: [
    "Valid timestamp constraint (timestamp IS NOT NULL)",
    "Exclusion of deleted posts (title not matching [deleted] or [deleted by user])",
    "Exclusion of moderator-removed posts (title not matching [removed] or [removed by moderator])",
    "Exclusion of unparsed zero-state rows where score = 0, upvote_ratio = 0, and num_comments = 0",
  ],
  snapshotSize: 51587,
  nlpModels: [
    {
      domain: "Sentiment Analysis",
      model: "cardiffnlp/twitter-xlm-roberta-base-sentiment",
      derivedVariables: "P_pos, P_neu, P_neg (continuous softmax probabilities summing to 1.0)",
    },
    {
      domain: "Topic Classification",
      model: "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
      derivedVariables: "Primary topic label and 30-class probability distribution; Shannon entropy H = -Σ p_i ln(p_i)",
    },
    {
      domain: "Named Entity Recognition",
      model: "SpaCy en_core_web_sm (with xx_ent_wiki_sm multilingual fallback)",
      derivedVariables: "16 entity types (MONEY, ORG, GPE, LOC, etc.); entity density = count / word count",
    },
    {
      domain: "Lexical Economics",
      model: "NLTK word_tokenize & WordNetLemmatizer",
      derivedVariables: "Word count, unique lemma count, Type-Token Ratio TTR = unique lemmas / word count",
    },
  ],
};

export const HYPOTHESES_PILLARS: PillarData[] = [
  {
    id: 1,
    number: 1,
    title: "Pillar 1: Affective & Behavioral Dynamics",
    subtitle: "Emotion and Community Action",
    hypotheses: [
      {
        id: "H1",
        pillarId: 1,
        pillarTitle: "Pillar 1: Emotion & Community Action",
        name: "Negativity and Engagement",
        plainQuestion:
          "Does a negative emotional tone lead to longer discussion threads while reducing post approval?",
        formalStatement:
          "Negative sentiment probability (P_neg) drives higher discussion depth (num_comments) and reduces post approval (upvote_ratio) across civic community discourse.",
        variables: [
          { name: "P_neg", role: "Independent", description: "Continuous negative sentiment probability [0.0, 1.0]" },
          { name: "num_comments", role: "Dependent", description: "Stabilized discussion thread comment count" },
          { name: "upvote_ratio", role: "Dependent", description: "Ratio of community upvotes relative to total votes [0.0, 1.0]" },
        ],
        methodAndRationale:
          "Spearman rank correlation (ρ) was selected because comment counts are heavily right-skewed and non-normal. Two-tailed significance testing at α = 0.05.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): P_neg vs comments ρ = +0.1924 (p < 0.001); P_neg vs upvote ratio ρ = −0.0254 (p < 0.001). Within the Berlin municipal slice alone (N = 1,089), approval correlation was ρ = −0.0859 (p = 0.0046).",
        verdict: "Supported",
        verdictDetail: "Supported; comments link is modest, approval link is very small.",
        whatItTellsUs:
          "Frustrated or grievance-oriented posts reliably mobilize community discussion and debate. Negative submissions tend to receive more comments than positive or neutral posts.",
        whatItDoesNotTellUs:
          "The relationship with upvote approval is exceedingly small across the global corpus (ρ = −0.0254), indicating that negative complaints are not routinely downvoted into oblivion if the issue resonates with residents.",
        chartType: "h1_bars",
      },
      {
        id: "H2",
        pillarId: 1,
        pillarTitle: "Pillar 1: Emotion & Community Action",
        name: "Polarization and Visibility",
        plainQuestion:
          "Do posts with strong, decisive emotional stances achieve higher net karma scores than balanced, neutral posts?",
        formalStatement:
          "Extreme opinion polarization, operationalized as emotional polarity magnitude |P_pos − P_neg|, correlates positively with net karma score amplification.",
        variables: [
          { name: "Polarity Magnitude |P_pos − P_neg|", role: "Independent", description: "Absolute divergence between positive and negative probabilities [0.0, 1.0]" },
          { name: "score", role: "Dependent", description: "Public net Reddit karma score (upvotes minus downvotes)" },
        ],
        methodAndRationale:
          "Bivariate Spearman correlation testing monotonic association between polarity distance from neutrality and net score rewards.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): Spearman ρ ≈ +0.22 to +0.24 (p < 0.001) across global cohorts. Within the Berlin municipal slice (N = 1,089), ρ = +0.1413 (p < 0.001). TODO_ALFAZ: confirm exact global vs slice reporting threshold.",
        verdict: "Supported",
        verdictDetail: "Supported across global and municipal cohorts.",
        whatItTellsUs:
          "Clear, impassioned points of view accumulate more upvotes than hedged or indifferent statements. Neutrality is rewarded less in public forum visibility.",
        whatItDoesNotTellUs:
          "Polarity measures emotional intensity, not logical validity. High scores do not imply that community members agree with the premise, only that the post engaged active voting behavior.",
        chartType: "none",
        calloutNote:
          "Polarity magnitude measures distance from emotional neutrality (|P_pos − P_neg|). Values near 1.0 indicate strong conviction; values near 0.0 indicate emotional indifference.",
      },
    ],
  },
  {
    id: 2,
    number: 2,
    title: "Pillar 2: Semantic Structure & Information Theory",
    subtitle: "Text Organization and Algorithmic Reward",
    hypotheses: [
      {
        id: "H3",
        pillarId: 2,
        pillarTitle: "Pillar 2: Semantic Structure",
        name: "Topic Ambiguity vs. Information Clarity",
        plainQuestion:
          "Are posts that wander across multiple themes penalized in karma score compared to sharply focused submissions?",
        formalStatement:
          "Informational Shannon entropy calculated across the topic distribution exhibits a negative relationship with log-transformed karma score, penalizing thematic ambiguity.",
        variables: [
          { name: "Shannon Entropy (H)", role: "Independent", description: "Entropy over the 30-class zero-shot topic distribution: H = -Σ p_i ln(p_i)" },
          { name: "ln(score + 1)", role: "Dependent", description: "Natural log-transformed net karma score" },
          { name: "ln(num_comments + 1)", role: "Control", description: "Natural log-transformed discussion thread depth" },
        ],
        methodAndRationale:
          "Ordinary Least Squares (OLS) multiple linear regression controlling for comment volume: ln(score + 1) = β0 + β1*Entropy + β2*ln(comments + 1) + ε.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): Entropy coefficient β1 = −0.5053 (SE = 0.031, t = −16.07, p < 0.001, 95% CI [−0.567, −0.444]). Discussion control coefficient β2 = +0.9175 (p < 0.001).",
        verdict: "Supported",
        verdictDetail: "Supported; thematic ambiguity is significantly associated with lower net karma.",
        whatItTellsUs:
          "Submissions with focused thematic concentration receive substantially higher community endorsement. Spreading probability evenly across many categories incurs reader friction.",
        whatItDoesNotTellUs:
          "Discussion depth also strongly correlates with score (β = +0.9175). Comment volume may partially mediate the visibility penalty of ambiguous posts.",
        chartType: "none",
        calloutNote:
          "Code verification: calculate_shannon_entropy in Scraping/database/kpis.py calculates natural log (np.log), yielding natural entropy units (nats) rather than base-2 bits.",
      },
      {
        id: "H4",
        pillarId: 2,
        pillarTitle: "Pillar 2: Semantic Structure",
        name: "Entity Specificity Moderation",
        plainQuestion:
          "Does citing concrete names, agencies, or monetary figures protect negative complaints from community downvotes?",
        formalStatement:
          "Named entity density (MONEY, ORG, GPE, LOC via SpaCy NER) moderates the relationship between negative sentiment (P_neg) and community approval.",
        variables: [
          { name: "P_neg", role: "Independent", description: "Continuous negative affect probability" },
          { name: "entity_density", role: "Moderator", description: "Count of MONEY, ORG, GPE, LOC tokens divided by total word count" },
          { name: "P_neg × entity_density", role: "Interaction", description: "Moderating interaction term" },
          { name: "upvote_ratio", role: "Dependent", description: "Community approval ratio [0.0, 1.0]" },
        ],
        methodAndRationale:
          "Moderated OLS linear regression: upvote_ratio = β0 + β1*P_neg + β2*entity_density + β3*(P_neg × entity_density) + β4*ln(comments + 1) + ε.",
        snapshotResult:
          "Snapshot, Nov 2026: The interaction coefficient could not be reliably estimated due to a rank-deficient design matrix. In the snapshot dataset, entity density showed near-zero variance across large portions of the corpus.",
        verdict: "Inconclusive",
        verdictDetail: "Inconclusive due to rank-deficient design matrix.",
        whatItTellsUs:
          "The test could not confirm or refute the theoretical hypothesis. As documented in nlp_processor.py, SpaCy was loaded primarily with en_core_web_sm with an unspecialized multilingual fallback, resulting in sparse entity extraction on non-English municipal texts.",
        whatItDoesNotTellUs:
          "We cannot state whether entity grounding helps or hurts approval until multilingual NER models (e.g. de_core_news_sm for German subreddits) are applied. TODO_ALFAZ: confirm re-run schedule.",
        chartType: "none",
        calloutNote:
          "Methodological note: This hypothesis produced an inconclusive result because entity extraction was sparse on multilingual posts. No chart is shown; the model is awaiting specialized language-specific NER pipelines.",
      },
    ],
  },
  {
    id: 3,
    number: 3,
    title: "Pillar 3: Urban Civic Domains",
    subtitle: "Contextual Topic Disparity",
    hypotheses: [
      {
        id: "H5",
        pillarId: 3,
        pillarTitle: "Pillar 3: Urban Civic Domains",
        name: "Civic Friction vs. Lifestyle Consensus",
        plainQuestion:
          "Do posts about housing and bureaucracy trigger more negative sentiment and lower approval than posts about cafes, arts, and events?",
        formalStatement:
          "Administrative and housing topics exhibit significantly higher negative sentiment (P_neg) and lower approval ratios (upvote_ratio) compared to cultural and lifestyle topics.",
        variables: [
          { name: "Topic Domain", role: "Independent", description: "Cluster classification: ADMIN_HOUSING (8 topics) vs. LIFESTYLE_CULTURE (7 topics)" },
          { name: "P_neg", role: "Dependent", description: "Negative sentiment probability" },
          { name: "upvote_ratio", role: "Dependent", description: "Community approval ratio" },
        ],
        methodAndRationale:
          "Two-sample Welch's unequal variances t-test comparing mean sentiment and mean upvote ratio between the two distinct civic topic clusters.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): Mean P_neg for Admin/Housing = 0.3842 vs. Lifestyle/Culture = 0.3315 (t = +5.98, p < 0.001). Mean upvote ratio for Admin/Housing = 0.7356 vs. Lifestyle/Culture = 0.7690 (t = −5.42, p < 0.001). Berlin slice approval was 0.6781 vs 0.7430 (p = 0.0026).",
        verdict: "Supported",
        verdictDetail: "Supported; administrative discourse carries significantly higher friction.",
        whatItTellsUs:
          "Institutional and housing topics carry systemic civic friction. Discussions about bureaucracy, rent, and legal paperwork provoke more negative language and lower community consensus than leisure discourse.",
        whatItDoesNotTellUs:
          "Topic clustering does not capture whether complaints are directed at municipal authorities or private landlords; it reflects aggregate affective tone in each domain.",
        chartType: "h5_bars",
      },
    ],
  },
  {
    id: 4,
    number: 4,
    title: "Pillar 4: Temporal Rhythms & Lexical Economics",
    subtitle: "Time Cycles and Textual Effort",
    hypotheses: [
      {
        id: "H6",
        pillarId: 4,
        pillarTitle: "Pillar 4: Time and Language",
        name: "Daily Rhythm and Affect Cycles",
        plainQuestion:
          "Does emotional negativity change throughout the day according to the local solar time of each city?",
        formalStatement:
          "Negative sentiment intensity (P_neg) and polarity follow significant local diurnal periodicities across local time windows.",
        variables: [
          { name: "Local Time Window", role: "Independent", description: "Four 6-hour windows: Night (00:00–05:59), Morning (06:00–12:59), Afternoon (13:00–18:59), Evening (19:00–23:59)" },
          { name: "P_neg", role: "Dependent", description: "Continuous negative affect probability" },
        ],
        methodAndRationale:
          "One-way Analysis of Variance (ANOVA) testing equality of mean P_neg across the four diurnal windows aligned to each subreddit's municipal IANA timezone.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): One-way ANOVA F(3, 51583) = 15.46, p = 4.76 × 10⁻¹⁰. Group means for P_neg: Night = 0.3399, Morning = 0.3679, Afternoon = 0.3611, Evening = 0.3601.",
        verdict: "Supported, small effect",
        verdictDetail: "Supported, but diurnal window explains under 0.1% of total variance.",
        whatItTellsUs:
          "Statistically significant diurnal variation exists. In the snapshot data, Morning hours exhibited the highest average negativity (0.3679), followed by Afternoon and Evening, with Night showing the lowest average (0.3399).",
        whatItDoesNotTellUs:
          "Although statistically significant due to the large sample (N = 51,587), the effect size is tiny (η² < 0.001). Time of day is not a primary driver of sentiment. Post-hoc pairwise tests remain pending.",
        chartType: "h6_bars",
        calloutNote:
          "Code vs. Doc note: Technical documentation originally hypothesized late-night grievance venting. However, empirical snapshot results demonstrate peak negativity occurring in Morning submissions (0.3679), with Night submissions averaging lowest (0.3399).",
      },
      {
        id: "H7",
        pillarId: 4,
        pillarTitle: "Pillar 4: Time and Language",
        name: "Vocabulary Diversity and Engagement",
        plainQuestion:
          "Is there a lexical sweet spot where posts with balanced vocabulary receive the most comments relative to city size?",
        formalStatement:
          "Controlling for community scale (total_users), Type-Token Ratio (TTR) exhibits an inverted U-shape relationship with scale-normalized comments.",
        variables: [
          { name: "TTR (Type-Token Ratio)", role: "Independent", description: "Ratio of unique lemmatized tokens to total word count [0.0, 1.0]" },
          { name: "TTR² (Quadratic term)", role: "Independent", description: "Squared Type-Token Ratio capturing non-linear curvature" },
          { name: "ln(total_users)", role: "Control", description: "Log-transformed subreddit subscriber count" },
          { name: "Normalized Comments", role: "Dependent", description: "(num_comments / total_users) × 10,000" },
        ],
        methodAndRationale:
          "Quadratic polynomial OLS regression: Normalized Comments = β0 + β1*TTR + β2*TTR² + β3*ln(total_users) + ε.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): Linear coefficient β1 = +1080.13 (p < 0.001), quadratic coefficient β2 = −707.26 (p < 0.001). Both terms significant at p < 0.001. Turning point TTR* = −β1 / (2*β2) ≈ 0.764.",
        verdict: "Supported",
        verdictDetail: "Supported; significant concave (inverted-U) relationship with inflection at TTR ≈ 0.764.",
        whatItTellsUs:
          "Community discussion depth increases as lexical richness grows, but reaches an inflection point around TTR = 0.764. Overly repetitive and excessively dense vocabularies both receive fewer normalized comments.",
        whatItDoesNotTellUs:
          "Type-Token Ratio naturally declines as post length increases. Part of this curvature reflects post length dynamics rather than pure vocabulary sophistication alone.",
        chartType: "h7_curve",
      },
    ],
  },
];

export const READING_RESULTS_CONTENT = {
  paragraphs: [
    {
      title: "What a p-value actually says",
      text: "A p-value measures the probability of observing data as extreme as what was measured, assuming the null hypothesis (that no true relationship exists) is true. When a p-value is below the threshold of 0.05, researchers reject the null hypothesis. It does not measure the probability that the hypothesis is correct, nor does it measure the strength or practical importance of the finding.",
    },
    {
      title: "Why huge sample sizes make tiny effects statistically significant",
      text: "With a dataset of 51,587 submissions, standard errors become very small. In large datasets, even trivial differences easily yield p < 0.001. A tiny p-value confirms that an observed relationship is unlikely to be random sampling noise, but it does not mean the effect has meaningful real-world impact.",
    },
    {
      title: "Understanding effect size over significance",
      text: "Effect size measures the magnitude of a relationship. For instance, in Hypothesis 1, negative sentiment is statistically linked to lower upvote approval with p < 0.001. However, the rank correlation is only ρ = −0.0254—an effect so small that negative sentiment accounts for less than 0.1% of the variation in post approval. Similarly, in Hypothesis 6, the diurnal time window achieves p = 4.76 × 10⁻¹⁰ in ANOVA, yet explains less than 0.1% of sentiment variance. Significance tells us an effect exists; effect size tells us how much it matters.",
    },
    {
      title: "Correlation versus causation in observational data",
      text: "Every model in this research is correlational. When post polarity correlates with higher karma (H2), this does not prove that adopting an extreme opinion causes community members to upvote. It indicates that emotionally decisive posts and high vote totals occur together. Confounding variables, author intent, and platform recommendation algorithms cannot be held constant in observational studies.",
    },
  ],
};

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    id: "alpha",
    term: "Alpha (Significance Level)",
    category: "Statistics",
    plainDefinition: "The predetermined probability threshold below which the null hypothesis is rejected. In this study, alpha is set to 0.05 (a 5% risk of concluding a difference exists when it does not).",
    formula: "α = 0.05",
    whereUsed: "Standard decision threshold applied across all seven hypothesis tests (H1–H7).",
  },
  {
    id: "anova",
    term: "ANOVA (One-Way Analysis of Variance)",
    category: "Statistics",
    plainDefinition: "A statistical test that compares the means of three or more independent groups to determine if at least one group mean is significantly different from the others.",
    formula: "F = MS_between / MS_within",
    whereUsed: "Used in H6 to test if mean negative sentiment differs across four diurnal time windows.",
  },
  {
    id: "attention-economy",
    term: "Attention Economy",
    category: "Civic & Platform",
    plainDefinition: "A framework treating human attention as a scarce resource in information-rich digital environments. In city forums, attention determines which municipal concerns get amplified or ignored.",
    whereUsed: "Framing concept for the entire thesis title and research question.",
  },
  {
    id: "civic-friction",
    term: "Civic Friction",
    category: "Civic & Platform",
    plainDefinition: "Institutional, logistical, and bureaucratic obstacles that citizens encounter in urban life, such as housing shortages, permit backlogs, and public transit disruptions.",
    whereUsed: "Tested in H5 by comparing administrative topics against lifestyle and recreational discourse.",
  },
  {
    id: "confidence-interval",
    term: "Confidence Interval (95% CI)",
    category: "Statistics",
    plainDefinition: "A range of plausible values for an unknown population parameter. A 95% confidence interval means that 95 out of 100 similarly constructed intervals would contain the true parameter.",
    formula: "CI = β ± (1.96 × SE)",
    whereUsed: "Reported in H3 for the Shannon entropy regression coefficient: 95% CI [−0.567, −0.444].",
  },
  {
    id: "correlation-vs-causation",
    term: "Correlation vs. Causation",
    category: "Statistics",
    plainDefinition: "A core principle stating that an observed association between two variables does not prove that one variable causes the other. Observational social stream data cannot establish causal mechanisms.",
    whereUsed: "Methodological guideline applied in 'How to read results' and across all hypothesis discussions.",
  },
  {
    id: "diurnal-cycle",
    term: "Diurnal Cycle",
    category: "Architecture",
    plainDefinition: "A 24-hour recurring temporal rhythm. In this project, UTC post timestamps are mapped to municipal local solar time to analyze circadian communication patterns.",
    formula: "t_local = UTC_timestamp.tz_convert(IANA_timezone)",
    whereUsed: "Operationalized in H6 across four 6-hour time windows (Night, Morning, Afternoon, Evening).",
  },
  {
    id: "effect-size",
    term: "Effect Size",
    category: "Statistics",
    plainDefinition: "A quantitative measure of the magnitude of a phenomenon, distinct from statistical significance. Examples include correlation coefficients (ρ) and regression coefficients (β).",
    whereUsed: "Evaluated in H1 (ρ = −0.0254) and H6 (η² < 0.001) to distinguish practical importance from large-sample significance.",
  },
  {
    id: "entity-density",
    term: "Entity Density",
    category: "NLP & Linguistics",
    plainDefinition: "The proportion of structured, verifiable named entities (money, agencies, locations) relative to the total word count of a post.",
    formula: "Entity Density = Count(MONEY + ORG + GPE + LOC) / Total Words",
    whereUsed: "Moderator variable tested in H4 to evaluate whether concrete anchors protect complaints from downvotes.",
  },
  {
    id: "iana-timezone",
    term: "IANA Timezone",
    category: "Architecture",
    plainDefinition: "The standard global database of timezone designations (e.g., Europe/Berlin, America/New_York) accounting for geographic longitude and daylight saving transitions.",
    whereUsed: "Configured per subreddit in the subreddits database table to synchronize local submission hours.",
  },
  {
    id: "interaction-moderation",
    term: "Interaction (Moderation)",
    category: "Statistics",
    plainDefinition: "A statistical model where the effect of an independent variable on a dependent variable depends on the level of a third moderator variable.",
    formula: "Y = β0 + β1*X + β2*M + β3*(X × M) + ε",
    whereUsed: "Operationalized in H4 to test if entity density (M) moderates negative sentiment (X) on upvote ratio (Y).",
  },
  {
    id: "inverted-u-relationship",
    term: "Inverted-U Relationship",
    category: "Statistics",
    plainDefinition: "A non-linear, concave curve where an outcome increases up to an optimal inflection point and decreases thereafter. Captured mathematically via a negative quadratic coefficient.",
    formula: "Y = β0 + β1*X + β2*X² where β2 < 0; Peak X* = -β1 / (2*β2)",
    whereUsed: "Confirmed in H7 for vocabulary diversity (TTR) and normalized comments, peaking at TTR ≈ 0.764.",
  },
  {
    id: "lemmatization",
    term: "Lemmatization",
    category: "NLP & Linguistics",
    plainDefinition: "The algorithmic process of reducing inflected word forms to their canonical dictionary base form (lemma) using vocabulary and morphological analysis.",
    whereUsed: "Executed via NLTK's WordNet Lemmatizer in nlp_processor.py prior to keyword aggregation.",
  },
  {
    id: "log-transform",
    term: "Log Transform (ln(x + 1))",
    category: "Statistics",
    plainDefinition: "A mathematical transformation applied to heavily right-skewed variables to stabilize variance and normalize distributions. Adding 1 prevents taking the logarithm of zero.",
    formula: "ln(x + 1)",
    whereUsed: "Applied to score and comment counts in H3 multiple regression, and to subscriber totals in H7.",
  },
  {
    id: "maturity-window",
    term: "Maturity Window (7-Day Delay)",
    category: "Architecture",
    plainDefinition: "A deliberate observation period between a post's publication and its ingestion into the analytical corpus, ensuring community voting and commenting have stabilized.",
    formula: "Age = (Current Timestamp − Post Timestamp) ≥ 7 Days",
    whereUsed: "Enforced by the background scraping worker (scraper_v2.py) prior to database insertion.",
  },
  {
    id: "sample-size-n",
    term: "N (Sample Size)",
    category: "Statistics",
    plainDefinition: "The total number of observational units included in an empirical analysis. Larger sample sizes increase statistical power and precision.",
    whereUsed: "The frozen thesis snapshot comprises N = 51,587 cleaned submissions from municipal subreddits.",
  },
  {
    id: "named-entity-recognition",
    term: "Named Entity Recognition (NER)",
    category: "NLP & Linguistics",
    plainDefinition: "An NLP pipeline that locates and classifies text spans into predefined categories such as person names, organizations, locations, monetary amounts, and laws.",
    whereUsed: "Implemented via SpaCy models (en_core_web_sm / xx_ent_wiki_sm) in nlp_processor.py.",
  },
  {
    id: "natural-language-inference",
    term: "Natural Language Inference (NLI)",
    category: "NLP & Linguistics",
    plainDefinition: "A machine learning task determining whether a premise sentence entails, contradicts, or is neutral toward a hypothesis sentence.",
    whereUsed: "Underlies zero-shot classification in mDeBERTa-v3 by testing whether a post entails candidate topic labels.",
  },
  {
    id: "nlp-pipeline",
    term: "NLP Pipeline",
    category: "Architecture",
    plainDefinition: "A sequential automated workflow that accepts raw text and applies tokenization, filtering, classification, and feature extraction stages.",
    whereUsed: "The local offline engine in nlp_processor.py coordinating sentiment, topics, entities, and lemmas.",
  },
  {
    id: "ols-regression",
    term: "OLS Regression (Ordinary Least Squares)",
    category: "Statistics",
    plainDefinition: "A linear regression method estimating unknown parameters by minimizing the sum of squared differences between observed values and values predicted by the linear model.",
    formula: "β = (X^T X)⁻¹ X^T Y",
    whereUsed: "Used in H3 (topic ambiguity), H4 (moderation), and H7 (quadratic lexical diversity).",
  },
  {
    id: "p-value",
    term: "P-Value",
    category: "Statistics",
    plainDefinition: "The probability of obtaining test results at least as extreme as the results actually observed, under the assumption that the null hypothesis is correct.",
    whereUsed: "Reported alongside every hypothesis test to assess statistical significance against α = 0.05.",
  },
  {
    id: "polarity",
    term: "Polarity (Emotional Polarity Magnitude)",
    category: "NLP & Linguistics",
    plainDefinition: "The absolute difference between positive and negative sentiment probabilities, measuring emotional intensity regardless of direction.",
    formula: "Polarity = |P_pos − P_neg| ∈ [0.0, 1.0]",
    whereUsed: "Operationalized in H2 to evaluate whether decisive stances accumulate higher net karma.",
  },
  {
    id: "primary-topic",
    term: "Primary Topic",
    category: "NLP & Linguistics",
    plainDefinition: "The single candidate topic label assigned the highest softmax entailment score by the zero-shot classifier.",
    whereUsed: "Stored in reddit_posts.topics->>'primary_topic' and used to group topic clusters in H5.",
  },
  {
    id: "rank-deficiency",
    term: "Rank Deficiency",
    category: "Statistics",
    plainDefinition: "A condition in linear regression where columns in the design matrix are linearly dependent or exhibit near-zero variance, preventing matrix inversion and unique parameter estimation.",
    whereUsed: "Occurred in H4 where entity density lacked variation across non-English texts, causing an inconclusive result.",
  },
  {
    id: "score-net-karma",
    term: "Score (Net Karma)",
    category: "Civic & Platform",
    plainDefinition: "The net public point total of a Reddit submission, representing total community upvotes minus downvotes.",
    formula: "Score = Upvotes − Downvotes",
    whereUsed: "Dependent variable in H2 and log-transformed in H3 (ln(score + 1)).",
  },
  {
    id: "sentiment-probability",
    term: "Sentiment Probability (P_neg, P_pos, P_neu)",
    category: "NLP & Linguistics",
    plainDefinition: "Continuous, calibrated probability outputs from the cross-lingual XLM-RoBERTa model reflecting confidence across three emotional categories.",
    formula: "P_pos + P_neu + P_neg = 1.0, P_i ∈ [0.0, 1.0]",
    whereUsed: "Core affective metrics used in H1, H2, H4, H5, and H6.",
  },
  {
    id: "shannon-entropy",
    term: "Shannon Entropy (H)",
    category: "Statistics",
    plainDefinition: "An Information Theory metric measuring the degree of uncertainty or dispersal across a probability distribution. Uniform distributions yield high entropy; focused distributions yield low entropy.",
    formula: "H = - Σ (p_i × ln(p_i)) for i = 1 to 30",
    whereUsed: "Key independent variable in H3, testing whether topic ambiguity incurs a visibility penalty.",
  },
  {
    id: "spearmans-rho",
    term: "Spearman's Rank Correlation (ρ)",
    category: "Statistics",
    plainDefinition: "A non-parametric measure of statistical dependence between the rankings of two variables, assessing how well a monotonic function describes their relationship.",
    formula: "ρ = 1 − [6 Σ d_i² / (n(n² − 1))]",
    whereUsed: "Employed in H1 and H2 because comment counts and karma scores follow heavy-tailed distributions.",
  },
  {
    id: "subreddit",
    term: "Subreddit",
    category: "Civic & Platform",
    plainDefinition: "A user-created, topic-specific or geography-specific community board on the Reddit social media platform prefixed with r/.",
    whereUsed: "The primary unit of data collection, focused on municipal forums (e.g., r/berlin, r/munich, r/nyc).",
  },
  {
    id: "transformer-models",
    term: "Transformer Model (XLM-RoBERTa & mDeBERTa-v3)",
    category: "NLP & Linguistics",
    plainDefinition: "Deep learning architectures based on multi-head self-attention mechanisms capable of processing long-range textual dependencies and cross-lingual representations.",
    whereUsed: "cardiffnlp/twitter-xlm-roberta-base-sentiment and MoritzLaurer/mDeBERTa-v3-base-mnli-xnli in nlp_processor.py.",
  },
  {
    id: "type-token-ratio",
    term: "Type-Token Ratio (TTR)",
    category: "NLP & Linguistics",
    plainDefinition: "A classical measure of vocabulary diversity calculated as the number of unique lemmatized word types divided by the total number of word tokens in a text.",
    formula: "TTR = Unique Lemmas / Total Words ∈ [0.0, 1.0]",
    whereUsed: "Independent variable in H7, testing for an inverted U-shape curve with comment engagement.",
  },
  {
    id: "upvote-ratio",
    term: "Upvote Ratio",
    category: "Civic & Platform",
    plainDefinition: "The proportion of total community votes cast on a post that were upvotes rather than downvotes, bounded between 0.0 and 1.0.",
    formula: "Upvote Ratio = Upvotes / (Upvotes + Downvotes)",
    whereUsed: "Primary consensus approval metric in H1, H4, and H5.",
  },
  {
    id: "welchs-t-test",
    term: "Welch's Two-Sample t-Test",
    category: "Statistics",
    plainDefinition: "A two-sample hypothesis test comparing group means that does not assume equal population variances or equal sample sizes.",
    formula: "t = (x̄1 − x̄2) / sqrt(s1²/n1 + s2²/n2)",
    whereUsed: "Employed in H5 to compare sentiment and upvote ratios between Admin/Housing and Lifestyle topics.",
  },
  {
    id: "zero-shot-classification",
    term: "Zero-Shot Classification",
    category: "NLP & Linguistics",
    plainDefinition: "A machine learning inference technique where a pre-trained model categorizes text into novel classes that it was not explicitly trained on, using semantic entailment.",
    whereUsed: "Used by mDeBERTa-v3 in nlp_processor.py to map posts into 30 municipal civic taxonomy categories.",
  },
];

export const LIMITATIONS_ETHICS_CONTENT = {
  limitations: [
    "Demographic skew: Reddit users do not represent the general population of any metropolitan city. Communities skew younger, more male, more tech-literate, and include higher proportions of expatriates and international students than official census baselines.",
    "Correlational design: All findings demonstrate observational associations rather than causal mechanisms. Engagement dynamics cannot isolate individual psychology from platform recommendation algorithms.",
    "Pretrained models in local contexts: Pretrained multilingual transformers were deployed without domain-specific fine-tuning on regional municipal slang. A manual validation sample is planned for future work.",
    "Zero-shot topic approximations: Classifying text into 30 civic categories via NLI entailment provides a strong heuristic approximation, but cannot substitute for in-depth qualitative coding.",
    "Multilingual text and NER sparsity: SpaCy's default English pipeline exhibited high error and missed entity spans on German, Dutch, and French submissions, causing H4 rank-deficiency.",
    "Length-dependent TTR: Type-Token Ratio naturally declines as post word count increases, meaning H7 captures both vocabulary diversity and text length dynamics.",
  ],
  ethics: [
    "Strict public scope: Only public Reddit submissions from open regional subreddits are ingested. Private communications, modmail, and closed groups are never accessed.",
    "Zero user profiling: Reddit usernames, author handles, user profile links, and account biographies are deliberately not scraped, stored, or indexed.",
    "100% self-hosted NLP: Machine learning models execute entirely on local, self-hosted hardware. No citizen text is ever transmitted to commercial third-party cloud AI APIs.",
    "Right to erasure (Art. 17 GDPR): Any Reddit author can request permanent removal of their submission by emailing khanalfaaz14@gmail.com with their post ID. The submission is purged without delay.",
    "Compliance with research frameworks: Conducted under GDPR Art. 6(1)(f) and Art. 89 academic research exemptions.",
    "Reddit Terms of Service: TODO_ALFAZ: review current platform terms and developer policy considerations.",
  ],
};

export const TECH_STACK_CATEGORIES: TechStackCategory[] = [
  {
    category: "Frontend",
    technologies: [
      { name: "React", version: "19.2.5", purpose: "Core UI single-page application library", source: "package.json" },
      { name: "TypeScript", version: "5.9.3", purpose: "Static typing and schema contract enforcement", source: "package.json" },
      { name: "Chakra UI v3", version: "3.35.0", purpose: "Accessible dark-theme layout primitives and styling", source: "package.json" },
      { name: "Redux Toolkit", version: "2.11.2", purpose: "Global client state (filters, server status, auth)", source: "package.json" },
      { name: "TanStack Query v5", version: "5.101.0", purpose: "Server state caching, deduplication, and async data fetching", source: "package.json" },
      { name: "Apache ECharts", version: "6.1.0", purpose: "Interactive time series and hypothesis data visualizations", source: "package.json" },
      { name: "Chart.js", version: "4.5.1", purpose: "Diurnal polar and frequency charting", source: "package.json" },
      { name: "React Router", version: "7.16.0", purpose: "Client-side routing and protected view boundaries", source: "package.json" },
      { name: "Vite", version: "8.0.10", purpose: "Production frontend bundler and local dev server", source: "package.json" },
    ],
  },
  {
    category: "Backend",
    technologies: [
      { name: "FastAPI", version: "0.110+", purpose: "Asynchronous REST gateway and WebSocket stream controller", source: "Scraping/requirements.txt" },
      { name: "Uvicorn", version: "0.29+", purpose: "Production ASGI web server running on port 8000", source: "Scraping/requirements.txt" },
      { name: "AsyncPG", version: "0.29+", purpose: "High-throughput asynchronous PostgreSQL connection pool driver", source: "Scraping/requirements.txt" },
      { name: "Playwright", version: "1.42+", purpose: "Headless Chromium browser automation for web ingestion", source: "Scraping/requirements.txt" },
      { name: "WebSockets", version: "12.0+", purpose: "Real-time queue state monitoring and reanalysis feeds", source: "Scraping/requirements.txt" },
    ],
  },
  {
    category: "NLP & Machine Learning",
    technologies: [
      { name: "PyTorch", version: "2.2+", purpose: "Deep learning framework with NVIDIA CUDA float16 acceleration", source: "Scraping/requirements.txt" },
      { name: "Transformers (XLM-RoBERTa)", version: "cardiffnlp", purpose: "Multilingual 3-class continuous sentiment probability estimation", source: "Scraping/requirements.txt" },
      { name: "Transformers (mDeBERTa-v3)", version: "MoritzLaurer", purpose: "30-class zero-shot municipal civic topic classification via NLI", source: "Scraping/requirements.txt" },
      { name: "SpaCy", version: "3.7.0+", purpose: "Named entity recognition pipelines (en_core_web_sm / xx_ent_wiki_sm)", source: "Scraping/requirements.txt" },
      { name: "NLTK", version: "3.8+", purpose: "Tokenization, stopword cleaning, and WordNet lemmatization", source: "Scraping/requirements.txt" },
    ],
  },
  {
    category: "Data & Persistence",
    technologies: [
      { name: "PostgreSQL", version: "15+", purpose: "Relational persistence with compound B-Tree and GIN JSONB indexes", source: "Scraping/Migrations/" },
      { name: "PostgreSQL LISTEN/NOTIFY", version: "Built-in", purpose: "Real-time database trigger events for scraping queue updates", source: "Scraping/Migrations/0009" },
      { name: "Pandas", version: "2.2+", purpose: "Time-series bucketing, SMA rolling windows, and data cleaning", source: "Scraping/requirements.txt" },
      { name: "NumPy", version: "2.0+", purpose: "Vectorized entropy math and array calculations", source: "Scraping/requirements.txt" },
    ],
  },
  {
    category: "Hosting, Testing & CI",
    technologies: [
      { name: "Vitest", version: "5.0.5", purpose: "Unit testing suite with JSDOM and React Testing Library", source: "package.json" },
      { name: "Playwright Test", version: "1.64.1", purpose: "End-to-end integration and smoke test verification", source: "package.json" },
      { name: "Pytest & Pytest-AsyncIO", version: "8.0+", purpose: "Backend API and database unit test suite", source: "Scraping/requirements.txt" },
      { name: "Firebase Hosting", version: "12.13+", purpose: "Static web deployment for single-page React frontend", source: "firebase.json" },
      { name: "Firebase Auth", version: "12.13+", purpose: "Role-based user authentication and administrative session tokens", source: "firebase_config.js" },
    ],
  },
];
