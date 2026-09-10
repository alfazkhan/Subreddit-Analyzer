import json
import numpy as np
import pandas as pd
from typing import Optional, Dict, Any, List
from scipy.stats import pearsonr, spearmanr, ttest_ind
from .core import get_db_pool, safe_parse_timestamp

# Defined Clusters for H2 Testing
ADMIN_HOUSING_TOPICS = {
    "RENT PRICES & AFFORDABILITY",
    "UTILITY BILLS & ENERGY COSTS",
    "CITY REGISTRATION & PAPERWORK",
    "VISAS & RESIDENCE PERMITS",
    "APARTMENT VIEWINGS & CONTRACTS",
    "FLATMATES & SHARED HOUSING",
    "LANDLORD DISPUTES & EVICTIONS",
    "SALARIES & COST OF LIVING RANTS"
}

LIFESTYLE_CULTURE_TOPICS = {
    "RESTAURANT & CAFE REVIEWS",
    "BARS, NIGHTCLUBS & NIGHTLIFE",
    "STREET FOOD & LOCAL CUISINES",
    "FESTIVALS, CONCERTS & PUBLIC EVENTS",
    "MUSEUMS, ART & THEATER",
    "AMATEUR SPORTS & FITNESS GROUPS",
    "TOURIST ATTRACTIONS & SIGHTSEEING"
}

def format_p_value(p: float) -> str:
    """Academic formatting for p-values."""
    if p < 0.001:
        return "< 0.001"
    return f"= {round(float(p), 4)}"

def calculate_correlations(series_a: pd.Series, series_b: pd.Series) -> Dict[str, Any]:
    """Computes both Pearson r and Spearman rho with sample validation."""
    valid = pd.concat([series_a, series_b], axis=1).dropna()
    n = len(valid)
    if n < 5:
        return {"n": n, "pearson_r": 0.0, "pearson_p": "= 1.0", "spearman_rho": 0.0, "spearman_p": "= 1.0"}
    
    pr_r, pr_p = pearsonr(valid.iloc[:, 0], valid.iloc[:, 1])
    sp_r, sp_p = spearmanr(valid.iloc[:, 0], valid.iloc[:, 1])
    
    return {
        "n": n,
        "pearson_r": round(float(pr_r), 4),
        "pearson_p": format_p_value(pr_p),
        "spearman_rho": round(float(sp_r), 4),
        "spearman_p": format_p_value(sp_p)
    }

async def calculate_db_kpis_timeseries(
    subreddit_id: Optional[int] = None, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    granularity: str = "daily",
    sma_window: int = 7
):
    pool = await get_db_pool()
    
    # 1. Excludes unpopulated records (where score=0, upvote_ratio=0, and num_comments=0 simultaneously)
    # 2. Excludes moderator-removed and user-deleted placeholders
    query = """
        SELECT 
            p.id,
            DATE_TRUNC('day', p.timestamp)::date AS post_date,
            p.score,
            p.upvote_ratio,
            p.num_comments,
            p.sentiment,
            p.sentiment_scores,
            p.topics,
            s.name AS subreddit_name
        FROM reddit_posts p
        JOIN subreddits s ON p.subreddit_id = s.id
        WHERE p.timestamp IS NOT NULL
          AND NOT (COALESCE(p.score, 0) = 0 AND COALESCE(p.upvote_ratio, 0) = 0 AND COALESCE(p.num_comments, 0) = 0)
          AND p.title NOT ILIKE '%[removed by moderator]%'
          AND p.title NOT ILIKE '%[deleted by user]%'
          AND p.title NOT ILIKE '%[deleted]%'
          AND p.title NOT ILIKE '%[removed]%'
    """
    args = []
    if subreddit_id:
        args.append(subreddit_id)
        query += f" AND p.subreddit_id = ${len(args)}"
    if start_date:
        args.append(safe_parse_timestamp(start_date))
        query += f" AND p.timestamp >= ${len(args)}::timestamp"
    if end_date:
        args.append(safe_parse_timestamp(end_date))
        query += f" AND p.timestamp <= ${len(args)}::timestamp"

    query += " ORDER BY p.timestamp ASC;"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)

    subreddit_name = rows[0]["subreddit_name"] if (rows and subreddit_id) else ("All Subreddits" if not subreddit_id else None)
    if subreddit_id and not subreddit_name:
        async with pool.acquire() as conn:
            subreddit_name = await conn.fetchval("SELECT name FROM subreddits WHERE id = $1", subreddit_id)

    if not rows:
        return [], {}, subreddit_name

    parsed_posts: List[Dict[str, Any]] = []
    
    for row in rows:
        if not row["post_date"]:
            continue

        raw_scores = row['sentiment_scores']
        scores = json.loads(raw_scores) if isinstance(raw_scores, str) else (raw_scores or {})
        
        pos_p = float(scores.get('pos', 0.0) or scores.get('positive', 0.0))
        neu_p = float(scores.get('neu', 0.0) or scores.get('neutral', 0.0))
        neg_p = float(scores.get('neg', 0.0) or scores.get('negative', 0.0))
        
        polarity_magnitude = abs(pos_p - neg_p)

        raw_topics = row['topics']
        topics = json.loads(raw_topics) if isinstance(raw_topics, str) else (raw_topics or {})
        primary_topic = "Unclassified"
        
        if isinstance(topics, dict) and topics:
            if "primary_topic" in topics and topics["primary_topic"]:
                primary_topic = topics["primary_topic"]
            elif "labels" in topics and isinstance(topics["labels"], list) and len(topics["labels"]) > 0:
                primary_topic = topics["labels"][0]
        elif isinstance(topics, list) and len(topics) > 0:
            primary_topic = topics[0]

        norm_topic = str(primary_topic).strip().upper()
        
        topic_cluster = "OTHER"
        if norm_topic in ADMIN_HOUSING_TOPICS:
            topic_cluster = "ADMIN_HOUSING"
        elif norm_topic in LIFESTYLE_CULTURE_TOPICS:
            topic_cluster = "LIFESTYLE_CULTURE"

        parsed_posts.append({
            "id": row["id"],
            "date": row["post_date"].isoformat(),
            "score": int(row["score"] or 0),
            "upvote_ratio": float(row["upvote_ratio"] or 0.0),
            "num_comments": int(row["num_comments"] or 0),
            "sentiment": row["sentiment"],
            "p_pos": pos_p,
            "p_neu": neu_p,
            "p_neg": neg_p,
            "polarity_magnitude": polarity_magnitude,
            "primary_topic": primary_topic,
            "topic_cluster": topic_cluster
        })

    if not parsed_posts:
        return [], {}, subreddit_name

    df = pd.DataFrame(parsed_posts)

    # ----------------------------------------------------
    # HYPOTHESIS TESTING CALCULATIONS
    # ----------------------------------------------------
    h1_neg_vs_comments = calculate_correlations(df["p_neg"], df["num_comments"])
    h1_neg_vs_upvote_ratio = calculate_correlations(df["p_neg"], df["upvote_ratio"])

    admin_df = df[df["topic_cluster"] == "ADMIN_HOUSING"]
    lifestyle_df = df[df["topic_cluster"] == "LIFESTYLE_CULTURE"]

    h2_stats: Dict[str, Any] = {
        "admin_housing_sample_size": len(admin_df),
        "lifestyle_culture_sample_size": len(lifestyle_df)
    }

    if len(admin_df) >= 3 and len(lifestyle_df) >= 3:
        t_neg, p_val_neg = ttest_ind(admin_df["p_neg"], lifestyle_df["p_neg"], equal_var=False)
        t_upvote, p_val_upvote = ttest_ind(admin_df["upvote_ratio"], lifestyle_df["upvote_ratio"], equal_var=False)

        h2_stats.update({
            "mean_neg_admin_housing": round(float(admin_df["p_neg"].mean()), 4),
            "mean_neg_lifestyle_culture": round(float(lifestyle_df["p_neg"].mean()), 4),
            "t_stat_negative_sentiment": round(float(t_neg), 4),
            "p_val_negative_sentiment": format_p_value(p_val_neg),
            "mean_upvote_ratio_admin_housing": round(float(admin_df["upvote_ratio"].mean()), 4),
            "mean_upvote_ratio_lifestyle_culture": round(float(lifestyle_df["upvote_ratio"].mean()), 4),
            "t_stat_upvote_ratio": round(float(t_upvote), 4),
            "p_val_upvote_ratio": format_p_value(p_val_upvote)
        })
    else:
        h2_stats.update({
            "status": "Insufficient samples in one or both topic clusters to conduct two-sample t-test."
        })

    h3_score_vs_polarity = calculate_correlations(df["score"], df["polarity_magnitude"])

    hypothesis_results = {
        "H1_controversy_dynamics": {
            "hypothesis": "Negative sentiment (P_neg) increases discussion volume (num_comments) and lowers upvote approval (upvote_ratio).",
            "p_neg_vs_num_comments": h1_neg_vs_comments,
            "p_neg_vs_upvote_ratio": h1_neg_vs_upvote_ratio
        },
        "H2_civic_pain_points": {
            "hypothesis": "Admin & Housing topics exhibit significantly higher negative sentiment and lower upvote ratios compared to Lifestyle & Culture.",
            "statistics": h2_stats
        },
        "H3_echo_chamber_amplification": {
            "hypothesis": "Extreme polar opinions (|P_pos - P_neg|) receive higher net engagement scores than moderate opinions.",
            "score_vs_polarity_magnitude": h3_score_vs_polarity
        }
    }

    # ----------------------------------------------------
    # TIME-SERIES AGGREGATION
    # ----------------------------------------------------
    df['date_dt'] = pd.to_datetime(df['date'])
    df = df.sort_values('date_dt').reset_index(drop=True)

    rule = "D"
    if granularity == "weekly":
        rule = "W-MON"
    elif granularity == "monthly":
        rule = "MS"

    grouped = df.groupby(pd.Grouper(key='date_dt', freq=rule))
    ts_rows = []
    
    for name, group in grouped:
        if group.empty:
            continue
        ts_rows.append({
            "date": name.strftime('%Y-%m-%d'),
            "post_count": int(len(group)),
            "avg_score": round(float(group["score"].mean()), 2),
            "avg_upvote_ratio": round(float(group["upvote_ratio"].mean()), 3),
            "avg_num_comments": round(float(group["num_comments"].mean()), 2),
            "avg_negative_sentiment": round(float(group["p_neg"].mean()), 4),
            "avg_positive_sentiment": round(float(group["p_pos"].mean()), 4),
            "admin_topic_count": int((group["topic_cluster"] == "ADMIN_HOUSING").sum()),
            "lifestyle_topic_count": int((group["topic_cluster"] == "LIFESTYLE_CULTURE").sum())
        })

    ts_df = pd.DataFrame(ts_rows)
    if not ts_df.empty:
        ts_df["avg_neg_sentiment_SMA"] = ts_df["avg_negative_sentiment"].rolling(window=sma_window, min_periods=1).mean().round(4)
        ts_df["avg_upvote_ratio_SMA"] = ts_df["avg_upvote_ratio"].rolling(window=sma_window, min_periods=1).mean().round(3)
        time_series = ts_df.to_dict(orient="records")
    else:
        time_series = []

    summary = {
        "total_analyzed_posts": len(df),
        "overall_mean_upvote_ratio": round(float(df["upvote_ratio"].mean()), 3),
        "overall_mean_comments": round(float(df["num_comments"].mean()), 2),
        "overall_mean_negative_sentiment": round(float(df["p_neg"].mean()), 4),
        "hypothesis_tests": hypothesis_results
    }

    return time_series, summary, subreddit_name