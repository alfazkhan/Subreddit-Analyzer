import json
import numpy as np
import pandas as pd
from typing import Optional, Dict, Any, List
from scipy.stats import pearsonr, spearmanr, ttest_ind, f_oneway
import statsmodels.api as sm
from statsmodels.formula.api import ols
from .core import get_db_pool, safe_parse_timestamp

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
    "toronto": "America/Toronto",
    "reactjs": "UTC"
}

def format_p_value(p: float) -> str:
    if pd.isna(p):
        return "= 1.0"
    if p < 0.001:
        return "< 0.001"
    return f"= {round(float(p), 4)}"

def calculate_correlations(series_a: pd.Series, series_b: pd.Series) -> Dict[str, Any]:
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

def calculate_shannon_entropy(scores: list) -> float:
    if not scores:
        return np.nan
    probs = np.array(scores, dtype=float)
    probs = probs[probs > 0]
    if len(probs) == 0:
        return np.nan
    probs = probs / np.sum(probs)
    return float(-np.sum(probs * np.log(probs)))

def calculate_ttr(keywords_dict: dict, word_count: int) -> float:
    if not keywords_dict or word_count <= 0:
        return 0.0
    return min(1.0, float(len(keywords_dict)) / float(word_count))

async def calculate_db_kpis_timeseries(
    subreddit_id: Optional[int] = None, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    granularity: str = "daily",
    sma_window: int = 7
):
    pool = await get_db_pool()
    
    query = """
        SELECT 
            p.id,
            DATE_TRUNC('day', p.timestamp)::date AS post_date,
            p.timestamp,
            p.title,
            p.body,
            p.score,
            p.upvote_ratio,
            p.num_comments,
            p.sentiment,
            p.sentiment_scores,
            p.topics,
            p.keywords,
            p.entities,
            s.name AS subreddit_name,
            COALESCE(s.total_users, 1000) AS total_users,
            COALESCE(s.timezone, 'UTC') AS timezone
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
        topic_scores = []

        if isinstance(topics, dict) and topics:
            topic_scores = topics.get("scores", [])
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

        # Lexical Complexity (H7)
        raw_kw = row['keywords']
        keywords_dict = json.loads(raw_kw) if isinstance(raw_kw, str) else (raw_kw or {})
        title_str = str(row['title'] or '')
        body_str = str(row['body'] or '')
        words = (title_str + " " + body_str).split()
        word_count = max(len(words), 1)
        ttr = calculate_ttr(keywords_dict, word_count)

        # Entity Extraction Density (H4: MONEY, ORG, GPE, LOC)
        raw_entities = row['entities']
        entities_list = json.loads(raw_entities) if isinstance(raw_entities, str) else (raw_entities or [])
        entity_count = 0
        if isinstance(entities_list, list):
            for ent in entities_list:
                if isinstance(ent, dict) and ent.get("label") in ["MONEY", "ORG", "GPE", "LOC"]:
                    entity_count += 1
                elif isinstance(ent, str):
                    entity_count += 1
        entity_density = entity_count / float(word_count)

        # Local Time Diurnal Windows (H6)
        tz_name = row['timezone'] or CITY_TIMEZONES.get(str(row['subreddit_name']).lower(), 'UTC')
        raw_ts = row['timestamp']
        try:
            ts_dt = pd.to_datetime(raw_ts, utc=True)
            local_hour = ts_dt.tz_convert(tz_name).hour
        except Exception:
            local_hour = getattr(raw_ts, "hour", 12)

        time_window = "Night (00-05)"
        if 6 <= local_hour <= 12:
            time_window = "Morning (06-12)"
        elif 13 <= local_hour <= 18:
            time_window = "Afternoon (13-18)"
        elif 19 <= local_hour <= 23:
            time_window = "Evening (19-23)"

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
            "topic_cluster": topic_cluster,
            "entropy": calculate_shannon_entropy(topic_scores),
            "word_count": word_count,
            "ttr": ttr,
            "entity_density": entity_density,
            "total_users": max(int(row["total_users"] or 1000), 1000),
            "local_hour": local_hour,
            "time_window": time_window
        })

    if not parsed_posts:
        return [], {}, subreddit_name

    df = pd.DataFrame(parsed_posts)

    # ----------------------------------------------------
    # PILLAR 1: Affective & Behavioral Dynamics
    # ----------------------------------------------------
    # H1: The Negativity-Engagement Dynamic
    h1_neg_vs_comments = calculate_correlations(df["p_neg"], df["num_comments"])
    h1_neg_vs_upvote_ratio = calculate_correlations(df["p_neg"], df["upvote_ratio"])

    # H2: The Opinion Polarization & Virality Dynamic
    h2_score_vs_polarity = calculate_correlations(df["score"], df["polarity_magnitude"])

    # ----------------------------------------------------
    # PILLAR 2: Semantic Structure & Information Theory
    # ----------------------------------------------------
    # H3: Topic Ambiguity vs. Information Clarity (Entropy vs log_score)
    h3_stats = {}
    h3_df = df.dropna(subset=["entropy"]).copy()
    h3_df["log_score"] = np.log1p(h3_df["score"].clip(lower=0))
    h3_df["log_comments"] = np.log1p(h3_df["num_comments"].clip(lower=0))
    if len(h3_df) >= 10:
        try:
            h3_model = ols("log_score ~ entropy + log_comments", data=h3_df).fit()
            entropy_coef = h3_model.params.get("entropy", 0.0)
            entropy_p = h3_model.pvalues.get("entropy", 1.0)
            h3_stats = {
                "sample_size": len(h3_df),
                "entropy_coef": round(float(entropy_coef), 4),
                "entropy_p_val": format_p_value(entropy_p),
                "r_squared": round(float(h3_model.rsquared), 4)
            }
        except Exception as e:
            h3_stats = {"error": str(e), "sample_size": len(h3_df)}
    else:
        h3_stats = {"status": "Insufficient entropy records."}

    # H4: Entity-Driven Specificity & Community Consensus
    h4_stats = {}
    try:
        h4_model = ols("upvote_ratio ~ entity_density * p_neg", data=df).fit()
        interaction_coef = h4_model.params.get("entity_density:p_neg", 0.0)
        interaction_p = h4_model.pvalues.get("entity_density:p_neg", 1.0)
        h4_stats = {
            "sample_size": len(df),
            "interaction_coef": round(float(interaction_coef), 4),
            "interaction_p_val": format_p_value(interaction_p),
            "r_squared": round(float(h4_model.rsquared), 4)
        }
    except Exception as e:
        h4_stats = {"error": str(e), "sample_size": len(df)}

    # ----------------------------------------------------
    # PILLAR 3: Urban Civic Semantics & Domain Friction
    # ----------------------------------------------------
    # H5: Civic Friction vs. Lifestyle Consensus
    admin_df = df[df["topic_cluster"] == "ADMIN_HOUSING"]
    lifestyle_df = df[df["topic_cluster"] == "LIFESTYLE_CULTURE"]

    h5_stats = {
        "admin_housing_sample_size": len(admin_df),
        "lifestyle_culture_sample_size": len(lifestyle_df)
    }
    if len(admin_df) >= 3 and len(lifestyle_df) >= 3:
        t_neg, p_val_neg = ttest_ind(admin_df["p_neg"], lifestyle_df["p_neg"], equal_var=False)
        t_upvote, p_val_upvote = ttest_ind(admin_df["upvote_ratio"], lifestyle_df["upvote_ratio"], equal_var=False)
        h5_stats.update({
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
        h5_stats["status"] = "Insufficient samples in one or both topic clusters."

    # ----------------------------------------------------
    # PILLAR 4: Temporal Rhythms & Lexical Economics
    # ----------------------------------------------------
    # H6: Diurnal & Temporal Affect Cycles
    h6_stats = {}
    diurnal_groups = [group["p_neg"].values for _, group in df.groupby("time_window", observed=False) if len(group) > 2]
    if len(diurnal_groups) >= 2:
        try:
            f_val, p_val = f_oneway(*diurnal_groups)
            group_means = df.groupby("time_window", observed=False)["p_neg"].mean().round(4).to_dict()
            h6_stats = {
                "sample_size": len(df),
                "f_stat": round(float(f_val), 4),
                "p_val": format_p_value(p_val),
                "group_means": group_means
            }
        except Exception as e:
            h6_stats = {"error": str(e)}
    else:
        h6_stats = {"status": "Insufficient time bins."}

    # H7: Scaled Community Virality & Lexical Diversity
    h7_stats = {}
    h7_df = df.copy()
    h7_df["normalized_comments"] = (h7_df["num_comments"] / h7_df["total_users"]) * 10000.0
    h7_df["log_users"] = np.log1p(h7_df["total_users"])
    if len(h7_df) >= 10:
        try:
            h7_model = ols("normalized_comments ~ ttr + I(ttr**2) + log_users", data=h7_df).fit()
            ttr_linear_coef = h7_model.params.get("ttr", 0.0)
            ttr_linear_p = h7_model.pvalues.get("ttr", 1.0)
            ttr_quad_coef = h7_model.params.get("I(ttr ** 2)", 0.0)
            ttr_quad_p = h7_model.pvalues.get("I(ttr ** 2)", 1.0)
            h7_stats = {
                "sample_size": len(h7_df),
                "linear_ttr_coef": round(float(ttr_linear_coef), 4),
                "linear_ttr_p_val": format_p_value(ttr_linear_p),
                "quadratic_ttr_coef": round(float(ttr_quad_coef), 4),
                "quadratic_ttr_p_val": format_p_value(ttr_quad_p),
                "inverted_u_shaped": bool(ttr_quad_coef < 0 and ttr_quad_p < 0.05)
            }
        except Exception as e:
            h7_stats = {"error": str(e), "sample_size": len(h7_df)}
    else:
        h7_stats = {"status": "Insufficient observations for lexical diversity modeling."}

    # Structured Pillar-Based Hypothesis Payload
    hypothesis_results = {
        "pillar_1_affective_behavioral": {
            "title": "Pillar 1: Affective & Behavioral Dynamics",
            "description": "User Emotion vs. Community Action",
            "H1": {
                "id": "H1",
                "name": "The Negativity-Engagement Dynamic",
                "p_neg_vs_num_comments": h1_neg_vs_comments,
                "p_neg_vs_upvote_ratio": h1_neg_vs_upvote_ratio
            },
            "H2": {
                "id": "H2",
                "name": "The Opinion Polarization & Virality Dynamic",
                "score_vs_polarity_magnitude": h2_score_vs_polarity
            }
        },
        "pillar_2_semantic_structure": {
            "title": "Pillar 2: Semantic Structure & Information Theory",
            "description": "Text Organization vs. Algorithmic Reward",
            "H3": {
                "id": "H3",
                "name": "Topic Ambiguity vs. Information Clarity",
                "statistics": h3_stats
            },
            "H4": {
                "id": "H4",
                "name": "Entity-Driven Specificity & Community Consensus",
                "statistics": h4_stats
            }
        },
        "pillar_3_urban_civic": {
            "title": "Pillar 3: Urban Civic Semantics & Domain Friction",
            "description": "Contextual Topic Disparity",
            "H5": {
                "id": "H5",
                "name": "Civic Friction vs. Lifestyle Consensus",
                "statistics": h5_stats
            }
        },
        "pillar_4_temporal_lexical": {
            "title": "Pillar 4: Temporal Rhythms & Lexical Economics",
            "description": "Time Cycles & Textual Effort",
            "H6": {
                "id": "H6",
                "name": "Diurnal & Temporal Affect Cycles",
                "statistics": h6_stats
            },
            "H7": {
                "id": "H7",
                "name": "Scaled Community Virality & Lexical Diversity",
                "statistics": h7_stats
            }
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