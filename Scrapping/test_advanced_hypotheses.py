import os
import json
import numpy as np
import pandas as pd
import psycopg2
import statsmodels.api as sm
from statsmodels.formula.api import ols
from scipy.stats import spearmanr

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "reddit-scrapper"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "admin123"),
}

CITY_TIMEZONES = {
    "munich": "Europe/Berlin",
    "berlin": "Europe/Berlin",
    "nyc": "America/New_York",
    "london": "Europe/London",
    "singapore": "Asia/Singapore",
    "losangeles": "America/Los_Angeles",
    "mumbai": "Asia/Kolkata",
    "delhi": "Asia/Kolkata",
    "amsterdam": "Europe/Amsterdam",
    "paris": "Europe/Paris",
    "hongkong": "Asia/Hong_Kong",
    "reactjs": "UTC"
}

def load_data():
    conn = psycopg2.connect(**DB_CONFIG)
    query = """
        SELECT 
            p.id,
            s.name AS subreddit,
            s.total_users,
            p.timestamp,
            p.title,
            p.body,
            p.score,
            p.upvote_ratio,
            p.num_comments,
            p.sentiment_scores,
            p.topics,
            p.keywords
        FROM reddit_posts p
        JOIN subreddits s ON p.subreddit_id = s.id
        WHERE p.timestamp IS NOT NULL
          AND NOT (COALESCE(p.score, 0) = 0 AND COALESCE(p.upvote_ratio, 0) = 0 AND COALESCE(p.num_comments, 0) = 0)
          AND p.title NOT ILIKE '%[removed by moderator]%'
          AND p.title NOT ILIKE '%[deleted by user]%'
          AND p.title NOT ILIKE '%[deleted]%'
          AND p.title NOT ILIKE '%[removed]%';
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def calculate_shannon_entropy(topic_obj):
    if not topic_obj:
        return np.nan
    if isinstance(topic_obj, str):
        try:
            topic_obj = json.loads(topic_obj)
        except Exception:
            return np.nan
    scores = topic_obj.get("scores", []) if isinstance(topic_obj, dict) else []
    if not scores:
        return np.nan
    probs = np.array(scores, dtype=float)
    probs = probs[probs > 0]
    if len(probs) == 0:
        return np.nan
    probs = probs / np.sum(probs)
    return -np.sum(probs * np.log(probs))

def calculate_ttr(keywords_obj, total_words):
    if not keywords_obj or total_words <= 0:
        return 0.0
    if isinstance(keywords_obj, str):
        try:
            keywords_obj = json.loads(keywords_obj)
        except Exception:
            return 0.0
    if isinstance(keywords_obj, dict):
        unique_tokens = len(keywords_obj)
        return float(unique_tokens) / float(total_words)
    return 0.0

def parse_sentiment_score(scores_obj, key):
    if not scores_obj:
        return 0.0
    if isinstance(scores_obj, str):
        try:
            scores_obj = json.loads(scores_obj)
        except Exception:
            return 0.0
    if isinstance(scores_obj, dict):
        return float(scores_obj.get(key, 0.0))
    return 0.0

def run_all_tests():
    df = load_data()
    print(f"Loaded {len(df)} cleaned records for hypothesis validation.\n")

    # Feature Engineering
    df["p_neg"] = df["sentiment_scores"].apply(lambda x: parse_sentiment_score(x, "negative"))
    df["p_pos"] = df["sentiment_scores"].apply(lambda x: parse_sentiment_score(x, "positive"))
    df["polarity"] = (df["p_pos"] - df["p_neg"]).abs()
    
    df["word_count"] = (df["title"].fillna("") + " " + df["body"].fillna("")).apply(lambda t: max(len(t.split()), 1))
    df["ttr"] = df.apply(lambda r: calculate_ttr(r["keywords"], r["word_count"]), axis=1)
    df["ttr"] = df["ttr"].clip(lower=0.0, upper=1.0)
    
    df["entropy"] = df["topics"].apply(calculate_shannon_entropy)
    df["log_score"] = np.log1p(df["score"].clip(lower=0))

    # Engagement metric normalization
    df["users_safe"] = df["total_users"].fillna(0).apply(lambda x: max(int(x), 1000))
    df["normalized_comments"] = (df["num_comments"] / df["users_safe"]) * 10000.0

    # Local Diurnal Time Conversion
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    def get_local_hour(row):
        tz_name = CITY_TIMEZONES.get(str(row["subreddit"]).lower(), "UTC")
        try:
            return row["timestamp"].tz_convert(tz_name).hour
        except Exception:
            return row["timestamp"].hour

    df["local_hour"] = df.apply(get_local_hour, axis=1)
    df["time_window"] = pd.cut(
        df["local_hour"], 
        bins=[-1, 5, 12, 18, 24], 
        labels=["Night (00-05)", "Morning (06-12)", "Afternoon (13-18)", "Evening (19-23)"]
    )

    # -------------------------------------------------------------
    # Test 1: H1 (Behavioral: Controversy & Discussion Velocity)
    # -------------------------------------------------------------
    print("=" * 70)
    print("TEST 1: H1 - Controversy & Engagement Velocity")
    print("=" * 70)
    rho_comm, p_comm = spearmanr(df["p_neg"], df["num_comments"])
    rho_ratio, p_ratio = spearmanr(df["p_neg"], df["upvote_ratio"])
    print(f"P_neg vs. num_comments : Spearman rho = {rho_comm:+.4f} (p-value: {p_comm:.4e})")
    print(f"P_neg vs. upvote_ratio : Spearman rho = {rho_ratio:+.4f} (p-value: {p_ratio:.4e})\n")

    # -------------------------------------------------------------
    # Test 2: H2 (Structural: Information Entropy vs. Karma Score)
    # -------------------------------------------------------------
    print("=" * 70)
    print("TEST 2: H2 - Topic Shannon Entropy -> Net Score")
    print("=" * 70)
    h2_df = df.dropna(subset=["entropy", "log_score"]).copy()
    h2_model = ols("log_score ~ entropy + np.log1p(num_comments)", data=h2_df).fit()
    print(h2_model.summary().tables[1])
    print(f"Entropy coefficient p-value: {h2_model.pvalues.get('entropy', 'N/A'):.4e}\n")

    # -------------------------------------------------------------
    # Test 3: H3 (Temporal: Local Diurnal Shifts in Civic Tone)
    # -------------------------------------------------------------
    print("=" * 70)
    print("TEST 3: H3 - Diurnal Shift in Negative Sentiment across Local Time")
    print("=" * 70)
    diurnal_stats = df.groupby("time_window", observed=False)[["p_neg", "polarity", "upvote_ratio"]].mean()
    print(diurnal_stats)
    h3_anova = ols("p_neg ~ C(time_window)", data=df).fit()
    anova_table = sm.stats.anova_lm(h3_anova, typ=2)
    print("\nANOVA Table (p_neg across time windows):")
    print(anova_table)
    print(f"ANOVA p-value: {anova_table['PR(>F)'].iloc[0]:.4e}\n")

    # -------------------------------------------------------------
    # Test 4: H4 (Lexical: Quadratic TTR on Scale-Normalized Comments)
    # -------------------------------------------------------------
    print("=" * 70)
    print("TEST 4: H4 - Lexical Diversity (Polynomial TTR) -> Normalized Comments")
    print("=" * 70)
    h4_df = df.dropna(subset=["ttr", "normalized_comments"]).copy()
    h4_model = ols("normalized_comments ~ ttr + I(ttr**2) + np.log1p(users_safe)", data=h4_df).fit()
    print(h4_model.summary().tables[1])
    p_ttr = h4_model.pvalues.get("ttr", 1.0)
    p_ttr2 = h4_model.pvalues.get("I(ttr ** 2)", 1.0)
    print(f"Linear TTR p-value   : {p_ttr:.4e}")
    print(f"Quadratic TTR p-value: {p_ttr2:.4e}")

if __name__ == "__main__":
    run_all_tests()