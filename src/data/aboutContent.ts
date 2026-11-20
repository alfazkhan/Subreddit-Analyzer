import type {
  GlossaryItem,
  PillarData,
  PipelineStep,
  PlatformTabScreenshot,
  TechStackCategory,
  TitledPoint,
} from "@/util/Types";
import kpiScreenshot from "@/assets/Screenshots/KPI-Analytics.png";
import sentimentsScreenshot from "@/assets/Screenshots/Sentiments.png";
import pieChartScreenshot from "@/assets/Screenshots/Pie-Chart.png";
import postTableScreenshot from "@/assets/Screenshots/Post-Table.png";
import keywordTableScreenshot from "@/assets/Screenshots/Keyword-Table.png";
import postFrequencyScreenshot from "@/assets/Screenshots/Post-Frequency.png";
import sentimentFrequencyScreenshot from "@/assets/Screenshots/Sentiment-Frequency.png";

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
    // TODO_ALFAZ: add LinkedIn URL. Empty values are not rendered.
    linkedin: "",
    email: "khanalfaaz14@gmail.com",
  },
  bio: "I'm a frontend developer who likes working with data and figuring out how to turn it into something useful.",
  whyIBuiltThis:
    "City subreddits are heavily moderated, text-based, and full of locals talking about everyday life. I wanted to see what they could tell us about the people in those cities and how they feel about different things.",
  // TODO_ALFAZ: H4 re-run status (planned / done / not planned). Currently:
  // insufficient data or methods to get a conclusive answer. Not rendered.
};

export const THESIS_METADATA = {
  title:
    "The Attention Economy of Digital Cities: An Empirical NLP Analysis of Emotion, Topic Clarity, and Civic Friction in Urban Social Streams",
  degree: "Master's Thesis Project, MBA General Management",
  institution: "International School of Management (ISM), Munich",
  submissionPeriod: "January 2027",
  snapshotDate: "November 2026",
  snapshotSampleSize: 51587,
  cityCount: 11,
  alphaLevel: 0.05,
  topicLabelCount: 30, // Verified from CANDIDATE_LABELS in Scraping/nlp_processor.py
  entropyBase: "natural logarithm (base e)", // Verified from calculate_shannon_entropy in Scraping/database/kpis.py
  normalizationMultiplier: 10000, // Verified from (num_comments / total_users) * 10000.0 in Scraping/database/kpis.py
};

export const THE_QUESTION = {
  paragraphs: [
    "City subreddits like r/berlin, r/munich, r/nyc, r/london and r/singapore work like a town square. Locals, commuters and newcomers post about rent, paperwork, transit, safety and things to do. Unlike most social feeds, the posts are long, mostly anonymous, and tied to real places.",
    "Attention in these forums is limited. Some posts get hundreds of comments; most get a handful. Some get upvoted; others sink. If we know what separates the two, we learn something about which local problems people care about and where the friction is.",
  ],
  researchQuestion:
    "How do emotional tone, topic structure, subject area, and posting time relate to the comments and approval a post receives in urban community discourse?",
};

export const THESIS_CONTEXT = {
  instrumentStatement:
    "This software is the research instrument for the thesis. The scraper, the language models and the statistical tests produce the results; the dashboard lets anyone see how.",
  contributions: [
    {
      title: "A baseline for city discourse",
      description:
        "Consistent measurements of sentiment, discussion volume and topic across 11 city subreddits, based on 51,587 posts.",
    },
    {
      title: "Probabilities instead of labels",
      description:
        "Each post gets a probability for every sentiment and topic, not a single hard label. That lets the analysis measure things like how mixed a post's topic is (Shannon entropy).",
    },
    {
      title: "A setup others can reuse",
      description:
        "Browser-based collection, a fixed 7-day wait before saving posts, and language models that run on local hardware. All of it can be rerun for non-commercial research.",
    },
  ],
};

// Screenshots of the real dashboard tabs
export const PLATFORM_TABS: PlatformTabScreenshot[] = [
  {
    tabValue: "KPIs",
    tabLabel: "KPIs",
    imageSrc: kpiScreenshot,
    caption:
      "Post volume over time with 7-day moving averages of negative sentiment and upvote ratio, plus live hypothesis results.",
    altText: "KPI tab showing a time series chart and hypothesis metrics.",
  },
  {
    tabValue: "Sentiments",
    tabLabel: "Sentiments",
    imageSrc: sentimentsScreenshot,
    caption: "Share of positive, neutral and negative posts, for all cities or one subreddit.",
    altText: "Sentiments tab with positive, neutral and negative percentage cards.",
  },
  {
    tabValue: "WordCloud",
    tabLabel: "Word cloud",
    // TODO_ALFAZ: add a WordCloud screenshot (previously reused Keyword-Table.png).
    caption: "The most frequent words across posts, after removing common filler words.",
    altText: "Word cloud of the most frequent words.",
  },
  {
    tabValue: "Pie Chart",
    tabLabel: "Keyword chart",
    imageSrc: pieChartScreenshot,
    caption: "The top keywords by frequency, coloured by the sentiment of the posts they appear in.",
    altText: "Pie chart of the most frequent keywords.",
  },
  {
    tabValue: "Posts Table",
    tabLabel: "Posts",
    imageSrc: postTableScreenshot,
    caption: "Every post with its score, upvote ratio, sentiment and main topic. Paginated and filterable.",
    altText: "Table of Reddit posts with scores and sentiment labels.",
  },
  {
    tabValue: "Keyword Table",
    tabLabel: "Keywords",
    imageSrc: keywordTableScreenshot,
    caption: "Word counts in table form. Users can flag words that should be filtered out.",
    altText: "Keyword table with frequency counts.",
  },
  {
    tabValue: "Posts Frequency",
    tabLabel: "Posts by hour",
    imageSrc: postFrequencyScreenshot,
    caption: "How many posts go up at each hour of the day, in each city's local time.",
    altText: "Line chart of post volume by hour of day.",
  },
  {
    tabValue: "Sentiments Frequency",
    tabLabel: "Sentiment by hour",
    imageSrc: sentimentFrequencyScreenshot,
    caption: "How the mix of positive, neutral and negative posts changes over the day, in local time.",
    altText: "Line chart of sentiment by hour of day.",
  },
];

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    stepNumber: 1,
    title: "Collect",
    system: "Playwright · scraper_v2.py",
    description:
      "A headless Chromium browser opens each of the 11 city subreddits and reads the public posts: ID, time, title, body, score, upvote ratio and comment count. No Reddit API key is needed.",
  },
  {
    stepNumber: 2,
    title: "Wait 7 days",
    system: "PostgreSQL queue · run_worker.py",
    description:
      "New posts sit in a queue until they are at least a week old. By then votes and comments have mostly stopped changing and moderators have removed rule-breaking posts.",
  },
  {
    stepNumber: 3,
    title: "Store",
    system: "PostgreSQL 15+ · reddit_posts",
    description:
      "Mature posts are saved to PostgreSQL. Indexes keep the tables fast to page through and search, and LISTEN/NOTIFY pushes changes to the admin view in real time.",
  },
  {
    stepNumber: 4,
    title: "Analyse",
    system: "Transformers, spaCy, NLTK · nlp_processor.py",
    description:
      "Four language tools run on local hardware, with no external API calls: sentiment (XLM-RoBERTa), 30 topics (mDeBERTa-v3), named entities (spaCy) and keywords (NLTK).",
  },
  {
    stepNumber: 5,
    title: "Serve",
    system: "FastAPI · React 19",
    description:
      "A FastAPI backend calculates moving averages and runs the hypothesis tests. The React dashboard fetches results with TanStack Query and draws charts with Apache ECharts.",
  },
];

export const DATA_METHOD_CONTENT = {
  maturityWindowExplanation:
    "Votes and comments change quickly in the first one to three days after a post goes up, and moderators remove rule-breaking posts during that time. Measuring too early gives misleading numbers. So the scraper waits until a post is at least seven days old before saving it.",
  storedFields: [
    { field: "Post ID", detail: "Reddit's ID for the post, without the prefix" },
    { field: "Time posted", detail: "Stored in UTC, converted to the city's local time for analysis" },
    { field: "Title and body", detail: "The public text, needed for the language analysis" },
    { field: "Score", detail: "Upvotes minus downvotes" },
    { field: "Upvote ratio", detail: "Share of votes that were upvotes, from 0 to 1" },
    { field: "Comment count", detail: "Number of comments after seven days" },
  ],
  deliberatelyExcludedFields: [
    "Usernames and profile handles",
    "Profile bios, karma history and avatars",
    "Reddit's internal user IDs",
    "Private messages and modmail",
    "Comment text and who wrote the comments",
  ],
  cleaningFilters: [
    "Posts with no timestamp",
    "Deleted posts ([deleted] or [deleted by user])",
    "Posts removed by moderators ([removed] or [removed by moderator])",
    "Rows that failed to parse (score, upvote ratio and comments all 0)",
  ],
  snapshotSize: 51587,
  nlpModels: [
    {
      domain: "Sentiment",
      model: "cardiffnlp/twitter-xlm-roberta-base-sentiment",
      derivedVariables: "Probability that a post is positive, neutral or negative (the three add up to 1).",
    },
    {
      domain: "Topic",
      model: "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
      derivedVariables: "A probability for each of 30 topics, the most likely topic, and how spread out the topics are (Shannon entropy).",
    },
    {
      domain: "Named entities",
      model: "spaCy en_core_web_sm (xx_ent_wiki_sm as multilingual fallback)",
      derivedVariables: "Mentions of money, organisations, places and 13 other types; entity density = mentions ÷ word count.",
    },
    {
      domain: "Vocabulary",
      model: "NLTK word_tokenize + WordNetLemmatizer",
      derivedVariables: "Word count, unique word count, and type-token ratio (unique words ÷ total words).",
    },
  ],
};

export const HYPOTHESES_PILLARS: PillarData[] = [
  {
    id: 1,
    number: 1,
    title: "Emotion",
    subtitle: "Does the tone of a post change how people respond?",
    hypotheses: [
      {
        id: "H1",
        pillarId: 1,
        pillarTitle: "Emotion",
        name: "Negativity and Engagement",
        plainQuestion:
          "Does a negative emotional tone lead to longer discussion threads while reducing post approval?",
        shortFinding: "Negative posts get more comments. Their upvote ratio is barely lower.",
        formalStatement:
          "Negative sentiment probability (P_neg) drives higher discussion depth (num_comments) and reduces post approval (upvote_ratio) across civic community discourse.",
        variables: [
          { name: "P_neg", role: "Independent", description: "Probability the post is negative, 0 to 1" },
          { name: "num_comments", role: "Dependent", description: "Comment count after seven days" },
          { name: "upvote_ratio", role: "Dependent", description: "Share of votes that were upvotes, 0 to 1" },
        ],
        methodAndRationale:
          "Spearman rank correlation (ρ) was selected because comment counts are heavily right-skewed and non-normal. Two-tailed tests at α = 0.05.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): P_neg vs comments ρ = +0.1924 (p < 0.001); P_neg vs upvote ratio ρ = −0.0254 (p < 0.001). Berlin only (N = 1,089): P_neg vs upvote ratio ρ = −0.0859 (p = 0.0046).",
        verdict: "Supported",
        verdictDetail: "Supported. The link to comments is modest; the link to approval is very small.",
        whatItTellsUs:
          "Posts with a negative tone, such as complaints and frustrations, reliably draw more comments than neutral or positive ones.",
        whatItDoesNotTellUs:
          "The drop in approval is tiny (ρ = −0.0254). Negative posts are not routinely downvoted, especially when the problem is one other residents share.",
        chartType: "h1_bars",
      },
      {
        id: "H2",
        pillarId: 1,
        pillarTitle: "Emotion",
        name: "Polarization and Visibility",
        plainQuestion:
          "Do posts that take a strong emotional stance get a higher score than balanced, neutral posts?",
        shortFinding: "Yes. Posts with a clear emotional stance score higher than neutral ones.",
        formalStatement:
          "Extreme opinion polarization, operationalized as emotional polarity magnitude |P_pos − P_neg|, correlates positively with net karma score amplification.",
        variables: [
          { name: "|P_pos − P_neg|", role: "Independent", description: "How far the post is from emotionally neutral, 0 to 1" },
          { name: "score", role: "Dependent", description: "Upvotes minus downvotes" },
        ],
        methodAndRationale:
          "Spearman rank correlation between distance from neutral and score.",
        // TODO_ALFAZ: confirm exact global ρ vs Berlin-slice reporting threshold.
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): Spearman ρ ≈ +0.22 to +0.24 (p < 0.001) across all cities. Berlin only (N = 1,089): ρ = +0.1413 (p < 0.001).",
        verdict: "Supported",
        verdictDetail: "Supported across all cities and in the Berlin subset.",
        whatItTellsUs:
          "Posts with a clear, strong point of view get more upvotes than hedged or indifferent ones. Being neutral doesn't get you noticed.",
        whatItDoesNotTellUs:
          "Polarity measures how strongly a post feels, not whether it is right. A high score doesn't mean people agree, only that they voted.",
        chartType: "none",
        calloutNote:
          "Polarity is |P_pos − P_neg|. Close to 1 means the post is clearly positive or clearly negative; close to 0 means it is neutral or mixed.",
      },
    ],
  },
  {
    id: 2,
    number: 2,
    title: "Structure",
    subtitle: "Does how clearly a post is written matter?",
    hypotheses: [
      {
        id: "H3",
        pillarId: 2,
        pillarTitle: "Structure",
        name: "Topic Ambiguity vs. Information Clarity",
        plainQuestion:
          "Do posts that wander across several topics score lower than posts focused on one?",
        shortFinding: "Yes. Focused posts score clearly higher than ones that mix topics.",
        formalStatement:
          "Informational Shannon entropy calculated across the topic distribution exhibits a negative relationship with log-transformed karma score, penalizing thematic ambiguity.",
        variables: [
          { name: "Entropy (H)", role: "Independent", description: "How spread out the 30 topic probabilities are: H = −Σ p_i ln(p_i)" },
          { name: "ln(score + 1)", role: "Dependent", description: "Score, log-transformed" },
          { name: "ln(num_comments + 1)", role: "Control", description: "Comment count, log-transformed" },
        ],
        methodAndRationale:
          "OLS regression controlling for comment volume: ln(score + 1) = β0 + β1·Entropy + β2·ln(comments + 1) + ε.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): entropy β1 = −0.5053 (SE = 0.031, t = −16.07, p < 0.001, 95% CI [−0.567, −0.444]). Comments β2 = +0.9175 (p < 0.001).",
        verdict: "Supported",
        verdictDetail: "Supported. Mixed-topic posts get significantly lower scores.",
        whatItTellsUs:
          "Posts that stick to one clear topic get noticeably more upvotes. Posts that spread across many topics lose out.",
        whatItDoesNotTellUs:
          "Comment count is also strongly tied to score (β = +0.9175), so part of the penalty may work through fewer comments.",
        chartType: "none",
        calloutNote:
          "Entropy is calculated with the natural log (np.log in Scraping/database/kpis.py), so it is measured in nats, not bits.",
      },
      {
        id: "H4",
        pillarId: 2,
        pillarTitle: "Structure",
        name: "Entity Specificity Moderation",
        plainQuestion:
          "Do complaints that name specific places, organisations or amounts avoid being downvoted?",
        shortFinding: "Unknown. Too few entities were detected to run the test.",
        formalStatement:
          "Named entity density (MONEY, ORG, GPE, LOC via SpaCy NER) moderates the relationship between negative sentiment (P_neg) and community approval.",
        variables: [
          { name: "P_neg", role: "Independent", description: "Probability the post is negative" },
          { name: "entity_density", role: "Moderator", description: "Money, organisation and place mentions ÷ word count" },
          { name: "P_neg × entity_density", role: "Moderator", description: "Interaction term" },
          { name: "upvote_ratio", role: "Dependent", description: "Share of votes that were upvotes" },
        ],
        methodAndRationale:
          "Moderated OLS regression: upvote_ratio = β0 + β1·P_neg + β2·entity_density + β3·(P_neg × entity_density) + β4·ln(comments + 1) + ε.",
        snapshotResult:
          "Snapshot, Nov 2026: the interaction coefficient could not be estimated because the design matrix was rank-deficient. Entity density was close to zero for large parts of the data.",
        verdict: "Inconclusive",
        verdictDetail: "Inconclusive. The model could not be estimated.",
        whatItTellsUs:
          "Nothing yet, in either direction. spaCy ran mainly with its English model, so it found very few entities in German, Dutch and French posts.",
        // TODO_ALFAZ: confirm re-run schedule.
        whatItDoesNotTellUs:
          "Whether naming specifics helps or hurts. That needs a re-run with language-specific models, such as de_core_news_sm for the German subreddits.",
        chartType: "none",
      },
    ],
  },
  {
    id: 3,
    number: 3,
    title: "Topic",
    subtitle: "Do some subjects cause more friction than others?",
    hypotheses: [
      {
        id: "H5",
        pillarId: 3,
        pillarTitle: "Topic",
        name: "Civic Friction vs. Lifestyle Consensus",
        plainQuestion:
          "Are posts about housing and bureaucracy more negative and less upvoted than posts about food, culture and events?",
        shortFinding: "Yes. Housing and admin posts are more negative and less approved.",
        formalStatement:
          "Administrative and housing topics exhibit significantly higher negative sentiment (P_neg) and lower approval ratios (upvote_ratio) compared to cultural and lifestyle topics.",
        variables: [
          { name: "Topic group", role: "Independent", description: "Admin & housing (8 topics) vs. lifestyle & culture (7 topics)" },
          { name: "P_neg", role: "Dependent", description: "Probability the post is negative" },
          { name: "upvote_ratio", role: "Dependent", description: "Share of votes that were upvotes" },
        ],
        methodAndRationale:
          "Welch's t-test (does not assume equal variances) comparing the two topic groups.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): mean P_neg admin/housing = 0.3842 vs. lifestyle/culture = 0.3315 (t = +5.98, p < 0.001). Mean upvote ratio 0.7356 vs. 0.7690 (t = −5.42, p < 0.001). Berlin only: upvote ratio 0.6781 vs. 0.7430 (p = 0.0026).",
        verdict: "Supported",
        verdictDetail: "Supported. Admin and housing posts show clearly more friction.",
        whatItTellsUs:
          "Posts about rent, paperwork and bureaucracy are more negative and get a lower share of upvotes than posts about leisure and culture.",
        whatItDoesNotTellUs:
          "Who the frustration is aimed at, whether city authorities or private landlords. The comparison only looks at overall tone per group.",
        chartType: "h5_bars",
      },
    ],
  },
  {
    id: 4,
    number: 4,
    title: "Time and language",
    subtitle: "Do the time of day and choice of words matter?",
    hypotheses: [
      {
        id: "H6",
        pillarId: 4,
        pillarTitle: "Time and language",
        name: "Daily Rhythm and Affect Cycles",
        plainQuestion:
          "Does negativity change over the course of the day, in each city's local time?",
        shortFinding: "Slightly. Mornings are most negative and nights least, but the effect is tiny.",
        formalStatement:
          "Negative sentiment intensity (P_neg) and polarity follow significant local diurnal periodicities across local time windows.",
        variables: [
          { name: "Time of day", role: "Independent", description: "Night 00:00–05:59, morning 06:00–12:59, afternoon 13:00–18:59, evening 19:00–23:59" },
          { name: "P_neg", role: "Dependent", description: "Probability the post is negative" },
        ],
        methodAndRationale:
          "One-way ANOVA comparing mean P_neg across the four windows, using each subreddit's local time zone.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): F(3, 51583) = 15.46, p = 4.76 × 10⁻¹⁰. Mean P_neg: night = 0.3399, morning = 0.3679, afternoon = 0.3611, evening = 0.3601.",
        verdict: "Supported, small effect",
        verdictDetail: "Supported, but time of day explains under 0.1% of the variation.",
        whatItTellsUs:
          "There is a real daily pattern: morning posts are the most negative (0.3679) and night posts the least (0.3399).",
        whatItDoesNotTellUs:
          "The difference is statistically real only because the sample is so large. The effect is tiny (η² < 0.001), so time of day barely matters. Pairwise follow-up tests are still to do.",
        chartType: "h6_bars",
        calloutNote:
          "We originally expected late-night venting to be the most negative. The data shows the opposite: nights are the least negative.",
      },
      {
        id: "H7",
        pillarId: 4,
        pillarTitle: "Time and language",
        name: "Vocabulary Diversity and Engagement",
        plainQuestion:
          "Is there a sweet spot in vocabulary variety where posts get the most comments?",
        shortFinding: "Yes. Comments peak at a type-token ratio of about 0.76.",
        formalStatement:
          "Controlling for community scale (total_users), Type-Token Ratio (TTR) exhibits an inverted U-shape relationship with scale-normalized comments.",
        variables: [
          { name: "TTR", role: "Independent", description: "Unique words ÷ total words, 0 to 1" },
          { name: "TTR²", role: "Independent", description: "TTR squared, to capture a curve" },
          { name: "ln(total_users)", role: "Control", description: "Subreddit size, log-transformed" },
          { name: "Normalized comments", role: "Dependent", description: "(num_comments ÷ total_users) × 10,000" },
        ],
        methodAndRationale:
          "Quadratic OLS regression: normalized comments = β0 + β1·TTR + β2·TTR² + β3·ln(total_users) + ε.",
        snapshotResult:
          "Snapshot, Nov 2026 (N = 51,587): β1 = +1080.13 (p < 0.001), β2 = −707.26 (p < 0.001). Peak at TTR* = −β1 / (2·β2) ≈ 0.764.",
        verdict: "Supported",
        verdictDetail: "Supported. An inverted-U curve peaking at TTR ≈ 0.764.",
        whatItTellsUs:
          "Comments rise as vocabulary gets more varied, up to a ratio of about 0.764, then fall. Very repetitive posts and very dense ones both get fewer comments.",
        whatItDoesNotTellUs:
          "Type-token ratio drops as posts get longer, so part of this curve is about post length, not only word choice.",
        chartType: "h7_curve",
      },
    ],
  },
];

export const READING_RESULTS_CONTENT: { paragraphs: TitledPoint[] } = {
  paragraphs: [
    {
      title: "A p-value is not the chance the hypothesis is true",
      text: "It's the chance of seeing data this extreme if there were really no relationship. Below 0.05, we reject the idea of no relationship. It says nothing about how big or important the relationship is.",
    },
    {
      title: "Big samples make tiny effects significant",
      text: "With 51,587 posts, even trivial differences come out at p < 0.001. A small p-value means the pattern probably isn't random noise, not that it matters in practice.",
    },
    {
      title: "Effect size tells you how much it matters",
      text: "In H1, negative tone is linked to lower approval with p < 0.001, but ρ = −0.0254: negativity accounts for less than 0.1% of the variation in approval. In H6, time of day reaches p = 4.76 × 10⁻¹⁰, yet explains less than 0.1% of sentiment variance. Significance says an effect exists; effect size says how big it is.",
    },
    {
      title: "Correlation is not causation",
      text: "Every result here is a correlation. When strong-stance posts score higher (H2), that doesn't prove a strong stance causes upvotes, only that the two go together. Author intent, Reddit's ranking algorithm and other factors can't be controlled for.",
    },
  ],
};

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    id: "alpha",
    term: "Alpha (significance level)",
    category: "Statistics",
    plainDefinition: "The cut-off for calling a result significant. Here it's 0.05: a 5% risk of seeing an effect that isn't there.",
    formula: "α = 0.05",
    whereUsed: "All seven hypothesis tests.",
  },
  {
    id: "anova",
    term: "ANOVA (one-way)",
    category: "Statistics",
    plainDefinition: "A test of whether the averages of three or more groups differ.",
    formula: "F = MS_between / MS_within",
    whereUsed: "H6, comparing negativity across four times of day.",
  },
  {
    id: "attention-economy",
    term: "Attention economy",
    category: "Civic & Platform",
    plainDefinition: "The idea that attention is scarce online. In city forums it decides which local problems get noticed.",
    whereUsed: "The framing of the thesis title and research question.",
  },
  {
    id: "civic-friction",
    term: "Civic friction",
    category: "Civic & Platform",
    plainDefinition: "The everyday hassles of city life: housing shortages, permit queues, transit problems.",
    whereUsed: "H5, comparing admin and housing posts with lifestyle posts.",
  },
  {
    id: "confidence-interval",
    term: "Confidence interval (95%)",
    category: "Statistics",
    plainDefinition: "A range of plausible values for the true effect. Intervals built this way contain the true value 95 times out of 100.",
    formula: "CI = β ± (1.96 × SE)",
    whereUsed: "H3: entropy coefficient 95% CI [−0.567, −0.444].",
  },
  {
    id: "correlation-vs-causation",
    term: "Correlation vs. causation",
    category: "Statistics",
    plainDefinition: "Two things moving together doesn't mean one causes the other. Observational data like Reddit posts can't prove cause.",
    whereUsed: "Every hypothesis on this page.",
  },
  {
    id: "diurnal-cycle",
    term: "Diurnal cycle",
    category: "Architecture",
    plainDefinition: "A pattern that repeats every 24 hours. Post times are converted from UTC to each city's local time to find it.",
    formula: "t_local = UTC_timestamp.tz_convert(IANA_timezone)",
    whereUsed: "H6, split into night, morning, afternoon and evening.",
  },
  {
    id: "effect-size",
    term: "Effect size",
    category: "Statistics",
    plainDefinition: "How big a relationship is, as opposed to whether it exists. Correlations (ρ) and regression coefficients (β) are examples.",
    whereUsed: "H1 (ρ = −0.0254) and H6 (η² < 0.001).",
  },
  {
    id: "entity-density",
    term: "Entity density",
    category: "NLP & Linguistics",
    plainDefinition: "How many concrete names (money, organisations, places) a post mentions relative to its length.",
    formula: "Count(MONEY + ORG + GPE + LOC) / total words",
    whereUsed: "H4, testing whether specifics protect complaints from downvotes.",
  },
  {
    id: "iana-timezone",
    term: "IANA time zone",
    category: "Architecture",
    plainDefinition: "Standard time zone names like Europe/Berlin or America/New_York, including daylight saving rules.",
    whereUsed: "Set per subreddit to convert post times to local time.",
  },
  {
    id: "interaction-moderation",
    term: "Interaction (moderation)",
    category: "Statistics",
    plainDefinition: "When the effect of one variable depends on the level of another.",
    formula: "Y = β0 + β1·X + β2·M + β3·(X × M) + ε",
    whereUsed: "H4: does entity density (M) change how negativity (X) affects upvote ratio (Y)?",
  },
  {
    id: "inverted-u-relationship",
    term: "Inverted-U relationship",
    category: "Statistics",
    plainDefinition: "An outcome that rises to a peak and then falls. Shows up as a negative squared term in a regression.",
    formula: "Y = β0 + β1·X + β2·X², β2 < 0; peak X* = −β1 / (2·β2)",
    whereUsed: "H7: comments peak at TTR ≈ 0.764.",
  },
  {
    id: "lemmatization",
    term: "Lemmatization",
    category: "NLP & Linguistics",
    plainDefinition: "Reducing words to their dictionary form, so “running” and “ran” both count as “run”.",
    whereUsed: "NLTK's WordNet lemmatizer, before counting keywords.",
  },
  {
    id: "log-transform",
    term: "Log transform, ln(x + 1)",
    category: "Statistics",
    plainDefinition: "Compresses very skewed numbers (a few posts with huge scores) so they don't dominate. The +1 avoids log(0).",
    formula: "ln(x + 1)",
    whereUsed: "Score and comments in H3; subreddit size in H7.",
  },
  {
    id: "maturity-window",
    term: "Maturity window (7 days)",
    category: "Architecture",
    plainDefinition: "The wait between a post going up and it being saved, so votes and comments have settled.",
    formula: "post age ≥ 7 days",
    whereUsed: "Enforced by the scraping worker before posts are stored.",
  },
  {
    id: "sample-size-n",
    term: "N (sample size)",
    category: "Statistics",
    plainDefinition: "The number of items analysed. More data gives more precise estimates.",
    whereUsed: "The thesis snapshot has N = 51,587 cleaned posts.",
  },
  {
    id: "named-entity-recognition",
    term: "Named entity recognition (NER)",
    category: "NLP & Linguistics",
    plainDefinition: "Finding names of people, organisations, places, amounts and so on in text.",
    whereUsed: "spaCy (en_core_web_sm / xx_ent_wiki_sm).",
  },
  {
    id: "natural-language-inference",
    term: "Natural language inference (NLI)",
    category: "NLP & Linguistics",
    plainDefinition: "Deciding whether one sentence implies, contradicts or is unrelated to another.",
    whereUsed: "How mDeBERTa-v3 assigns topics without topic-specific training.",
  },
  {
    id: "nlp-pipeline",
    term: "NLP pipeline",
    category: "Architecture",
    plainDefinition: "The chain of steps that turns raw text into numbers: splitting into words, filtering, classifying.",
    whereUsed: "nlp_processor.py: sentiment, topics, entities and keywords.",
  },
  {
    id: "ols-regression",
    term: "OLS regression",
    category: "Statistics",
    plainDefinition: "Fits a straight-line model by minimising the squared gaps between predicted and actual values.",
    formula: "β = (XᵀX)⁻¹ XᵀY",
    whereUsed: "H3, H4 and H7.",
  },
  {
    id: "p-value",
    term: "p-value",
    category: "Statistics",
    plainDefinition: "The chance of seeing results this extreme if there were really no effect.",
    whereUsed: "Every hypothesis test, compared with α = 0.05.",
  },
  {
    id: "polarity",
    term: "Polarity",
    category: "NLP & Linguistics",
    plainDefinition: "How strongly emotional a post is, ignoring whether it's positive or negative.",
    formula: "|P_pos − P_neg|, from 0 to 1",
    whereUsed: "H2.",
  },
  {
    id: "primary-topic",
    term: "Primary topic",
    category: "NLP & Linguistics",
    plainDefinition: "The single most likely of the 30 topics for a post.",
    whereUsed: "Grouping posts into topic clusters for H5.",
  },
  {
    id: "rank-deficiency",
    term: "Rank deficiency",
    category: "Statistics",
    plainDefinition: "When a regression's inputs are redundant or barely vary, so the model can't be solved.",
    whereUsed: "Why H4 is inconclusive: entity density was nearly always zero.",
  },
  {
    id: "score-net-karma",
    term: "Score",
    category: "Civic & Platform",
    plainDefinition: "A post's upvotes minus its downvotes.",
    formula: "upvotes − downvotes",
    whereUsed: "H2, and log-transformed in H3.",
  },
  {
    id: "sentiment-probability",
    term: "Sentiment probability",
    category: "NLP & Linguistics",
    plainDefinition: "The model's confidence that a post is positive (P_pos), neutral (P_neu) or negative (P_neg).",
    formula: "P_pos + P_neu + P_neg = 1",
    whereUsed: "H1, H2, H4, H5 and H6.",
  },
  {
    id: "shannon-entropy",
    term: "Shannon entropy",
    category: "Statistics",
    plainDefinition: "How spread out a set of probabilities is. A post clearly about one topic has low entropy; one that could be about anything has high entropy.",
    formula: "H = −Σ p_i ln(p_i), i = 1…30",
    whereUsed: "H3.",
  },
  {
    id: "spearmans-rho",
    term: "Spearman's ρ",
    category: "Statistics",
    plainDefinition: "A correlation based on rank order rather than raw values, so a few extreme posts can't distort it.",
    formula: "ρ = 1 − 6Σd_i² / (n(n² − 1))",
    whereUsed: "H1 and H2.",
  },
  {
    id: "subreddit",
    term: "Subreddit",
    category: "Civic & Platform",
    plainDefinition: "A community on Reddit, named with r/ in front.",
    whereUsed: "The unit of collection: r/berlin, r/munich, r/nyc and others.",
  },
  {
    id: "transformer-models",
    term: "Transformer model",
    category: "NLP & Linguistics",
    plainDefinition: "The type of neural network behind modern language models. These ones handle many languages.",
    whereUsed: "XLM-RoBERTa for sentiment, mDeBERTa-v3 for topics.",
  },
  {
    id: "type-token-ratio",
    term: "Type-token ratio (TTR)",
    category: "NLP & Linguistics",
    plainDefinition: "Unique words divided by total words. Higher means more varied vocabulary.",
    formula: "unique lemmas / total words",
    whereUsed: "H7.",
  },
  {
    id: "upvote-ratio",
    term: "Upvote ratio",
    category: "Civic & Platform",
    plainDefinition: "The share of a post's votes that were upvotes, from 0 to 1.",
    formula: "upvotes / (upvotes + downvotes)",
    whereUsed: "H1, H4 and H5.",
  },
  {
    id: "welchs-t-test",
    term: "Welch's t-test",
    category: "Statistics",
    plainDefinition: "Compares the averages of two groups without assuming they have the same spread or size.",
    formula: "t = (x̄1 − x̄2) / √(s1²/n1 + s2²/n2)",
    whereUsed: "H5.",
  },
  {
    id: "zero-shot-classification",
    term: "Zero-shot classification",
    category: "NLP & Linguistics",
    plainDefinition: "Sorting text into categories the model was never specifically trained on.",
    whereUsed: "Assigning posts to the 30 topics.",
  },
];

export const LIMITATIONS_ETHICS_CONTENT: {
  limitations: TitledPoint[];
  ethics: TitledPoint[];
} = {
  limitations: [
    {
      title: "Reddit isn't the city.",
      text: "Users skew younger, more male, more tech-savvy, and include more expats and international students than the general population.",
    },
    {
      title: "Correlation only.",
      text: "None of the results show cause and effect, and Reddit's own ranking algorithm can't be separated out.",
    },
    {
      title: "Models weren't tuned for local slang.",
      text: "The language models are used as-is, without training on city-specific language. A manual accuracy check is planned.",
    },
    {
      title: "Topics are approximate.",
      text: "Automatic sorting into 30 topics is a useful estimate, not a replacement for a human reading the posts.",
    },
    {
      title: "Entity detection is weak outside English.",
      text: "spaCy's English model missed most names in German, Dutch and French posts, which is why H4 couldn't be tested.",
    },
    {
      title: "Vocabulary variety depends on length.",
      text: "Longer posts naturally have a lower type-token ratio, so H7 partly measures post length.",
    },
  ],
  // TODO_ALFAZ: review current Reddit terms and developer policy, then add a line here.
  ethics: [
    {
      title: "Public posts only.",
      text: "Only public posts from open city subreddits are collected. No private messages, modmail or closed communities.",
    },
    {
      title: "No user data.",
      text: "Usernames, profile links and bios are never collected or stored.",
    },
    {
      title: "Everything runs locally.",
      text: "The language models run on my own hardware. No post text is sent to a commercial AI service.",
    },
    {
      title: "You can have your post removed.",
      text: "Email khanalfaaz14@gmail.com with the post ID and it will be deleted (GDPR Art. 17).",
    },
    {
      title: "Legal basis.",
      text: "GDPR Art. 6(1)(f) and the Art. 89 exemption for academic research.",
    },
  ],
};

export const TECH_STACK_CATEGORIES: TechStackCategory[] = [
  {
    category: "Frontend",
    technologies: [
      { name: "React", version: "19.2.5", purpose: "UI", source: "package.json" },
      { name: "TypeScript", version: "5.9.3", purpose: "Types", source: "package.json" },
      { name: "Chakra UI v3", version: "3.35.0", purpose: "Components and styling", source: "package.json" },
      { name: "Redux Toolkit", version: "2.11.2", purpose: "Filters, server status, auth", source: "package.json" },
      { name: "TanStack Query v5", version: "5.101.0", purpose: "Data fetching and caching", source: "package.json" },
      { name: "Apache ECharts", version: "6.1.0", purpose: "Most charts", source: "package.json" },
      { name: "Chart.js", version: "4.5.1", purpose: "Remaining older charts", source: "package.json" },
      { name: "React Router", version: "7.16.0", purpose: "Routing", source: "package.json" },
      { name: "Vite", version: "8.0.10", purpose: "Build and dev server", source: "package.json" },
    ],
  },
  {
    category: "Backend",
    technologies: [
      { name: "FastAPI", version: "0.110+", purpose: "REST API and WebSockets", source: "Scraping/requirements.txt" },
      { name: "Uvicorn", version: "0.29+", purpose: "Server", source: "Scraping/requirements.txt" },
      { name: "AsyncPG", version: "0.29+", purpose: "PostgreSQL driver", source: "Scraping/requirements.txt" },
      { name: "Playwright", version: "1.42+", purpose: "Scraping", source: "Scraping/requirements.txt" },
      { name: "WebSockets", version: "12.0+", purpose: "Live queue status", source: "Scraping/requirements.txt" },
    ],
  },
  {
    category: "NLP & Machine Learning",
    technologies: [
      { name: "PyTorch", version: "2.2+", purpose: "Runs the models (GPU or CPU)", source: "Scraping/requirements.txt" },
      { name: "XLM-RoBERTa", version: "cardiffnlp", purpose: "Sentiment", source: "Scraping/requirements.txt" },
      { name: "mDeBERTa-v3", version: "MoritzLaurer", purpose: "Topics", source: "Scraping/requirements.txt" },
      { name: "SpaCy", version: "3.7.0+", purpose: "Named entities", source: "Scraping/requirements.txt" },
      { name: "NLTK", version: "3.8+", purpose: "Tokens, stopwords, lemmas", source: "Scraping/requirements.txt" },
    ],
  },
  {
    category: "Data & Persistence",
    technologies: [
      { name: "PostgreSQL", version: "15+", purpose: "Database", source: "Scraping/Migrations/" },
      { name: "LISTEN/NOTIFY", version: "built-in", purpose: "Real-time change events", source: "Scraping/Migrations/0009" },
      { name: "Pandas", version: "2.2+", purpose: "Time series, moving averages", source: "Scraping/requirements.txt" },
      { name: "NumPy", version: "2.0+", purpose: "Entropy and array maths", source: "Scraping/requirements.txt" },
    ],
  },
  {
    category: "Hosting, Testing & CI",
    technologies: [
      { name: "Vitest", version: "5.0.5", purpose: "Unit tests", source: "package.json" },
      { name: "Playwright Test", version: "1.64.1", purpose: "End-to-end tests", source: "package.json" },
      { name: "Pytest", version: "8.0+", purpose: "Backend tests", source: "Scraping/requirements.txt" },
      { name: "Firebase Hosting", version: "12.13+", purpose: "Frontend hosting", source: "firebase.json" },
      { name: "Firebase Auth", version: "12.13+", purpose: "Login and roles", source: "firebase_config.js" },
    ],
  },
];
