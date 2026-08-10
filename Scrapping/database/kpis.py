import json
import numpy as np
import pandas as pd
from typing import Optional
from .core import get_db_pool, safe_parse_timestamp
from scipy.stats import pearsonr

# Comprehensive mapping from sub-topic candidate labels to the 5 Core KPI codes
CANDIDATE_LABEL_MAP = {
    # 1. Economic Sentiment Index (ESI)
    "RENT PRICES & AFFORDABILITY": "ESI",
    "UTILITY BILLS & ENERGY COSTS": "ESI",
    "JOB POSTINGS & CAREER ADVICE": "ESI",
    "SALARIES & COST OF LIVING RANTS": "ESI",
    "SUPERMARKET PRICES & GROCERIES": "ESI",

    # 2. Infrastructure & Services Index (ISI)
    "SUBWAY, TRAM & TRAIN SCHEDULES": "ISI",
    "BUS ROUTES & RELIABILITY": "ISI",
    "TRANSIT PASSES & TICKET PRICING": "ISI",
    "BICYCLE LANES & CYCLING SAFETY": "ISI",
    "TRAFFIC CONGESTION & ROADWORK": "ISI",
    "CITY PARKING & DRIVING PERMITS": "ISI",
    "CITY REGISTRATION & PAPERWORK": "ISI",
    "HOME MAINTENANCE & DAMAGE REPAIRS": "ISI",

    # 3. Local Consumer Intent Index (CII)
    "RESTAURANT & CAFE REVIEWS": "CII",
    "BARS, NIGHTCLUBS & NIGHTLIFE": "CII",
    "STREET FOOD & LOCAL CUISINES": "CII",
    "FESTIVALS, CONCERTS & PUBLIC EVENTS": "CII",
    "MUSEUMS, ART & THEATER": "CII",
    "AMATEUR SPORTS & FITNESS GROUPS": "CII",
    "TOURIST ATTRACTIONS & SIGHTSEEING": "CII",

    # 4. Community Concern & Safety Index (CCI)
    "NEIGHBORHOOD SAFETY & CRIME ALERTS": "CCI",
    "PROTESTS, STRIKES & DEMONSTRATIONS": "CCI",
    "CITY COUNCIL POLICIES & BUDGETS": "CCI",
    "LOCAL ELECTIONS & CANDIDATES": "CCI",
    "LOST ITEMS & FOUND BELONGINGS": "CCI",

    # 5. Expat & Integration Index (EII)
    "VISAS & RESIDENCE PERMITS": "EII",
    "APARTMENT VIEWINGS & CONTRACTS": "EII",
    "FLATMATE SEARCHES": "EII",
    "FLATMATES & SHARED HOUSING": "EII",
    "LANDLORD DISPUTES & EVICTIONS": "EII",
    "STUDENT SHIFTS & PART-TIME WORK": "EII",
    "STUDENT SHIFTS": "EII"
}

def calculate_pearson_with_pvalue(series_a, series_b):
    """
    Computes Pearson r correlation coefficient and p-value safely.
    """
    valid = pd.concat([series_a, series_b], axis=1).dropna()
    if len(valid) < 3:
        return 0.0, 1.0
    r, p = pearsonr(valid.iloc[:, 0], valid.iloc[:, 1])
    return round(float(r), 3), float(p)

def format_p_value(p):
    """
    Formats p-value for academic reporting.
    """
    if p < 0.001:
        return "< 0.001"
    return f"= {round(p, 3)}"

async def calculate_db_kpis_timeseries(
    subreddit_id: int, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    granularity: str = "daily",
    sma_window: int = 7
):
    pool = await get_db_pool()
    
    query = """
        SELECT 
            DATE_TRUNC('day', p.timestamp)::date as post_date,
            p.id,
            p.sentiment_scores,
            p.topics,
            s.name as subreddit_name
        FROM reddit_posts p
        JOIN subreddits s ON p.subreddit_id = s.id
        WHERE p.subreddit_id = $1
    """
    args = [subreddit_id]
    if start_date:
        args.append(safe_parse_timestamp(start_date))
        query += f" AND p.timestamp >= ${len(args)}::timestamp"
    if end_date:
        args.append(safe_parse_timestamp(end_date))
        query += f" AND p.timestamp <= ${len(args)}::timestamp"

    query += " ORDER BY post_date ASC;"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)

    subreddit_name = rows[0]["subreddit_name"] if rows else None
    if not subreddit_name:
        async with pool.acquire() as conn:
            subreddit_name = await conn.fetchval("SELECT name FROM subreddits WHERE id = $1", subreddit_id)

    daily_raw = {}

    for row in rows:
        d_str = row['post_date'].isoformat()
        if d_str not in daily_raw:
            daily_raw[d_str] = {
                "ESI": {"pos": 0.0, "neg": 0.0, "count": 0},
                "ISI": {"pos": 0.0, "neg": 0.0, "count": 0},
                "CII": {"pos": 0.0, "neg": 0.0, "count": 0},
                "CCI": {"pos": 0.0, "neg": 0.0, "count": 0},
                "EII": {"pos": 0.0, "neg": 0.0, "count": 0},
                "total_daily_posts": 0
            }
        
        daily_raw[d_str]["total_daily_posts"] += 1
        
        scores = json.loads(row['sentiment_scores']) if isinstance(row['sentiment_scores'], str) else (row['sentiment_scores'] or {})
        topics = json.loads(row['topics']) if isinstance(row['topics'], str) else (row['topics'] or {})
        
        pos_p = float(scores.get('pos', 0.0) or scores.get('positive', 0.0))
        neg_p = float(scores.get('neg', 0.0) or scores.get('negative', 0.0))

        raw_label = None
        if isinstance(topics, dict) and topics:
            if "labels" in topics and isinstance(topics["labels"], list) and len(topics["labels"]) > 0:
                raw_label = topics["labels"][0]
            elif "primary_topic" in topics:
                raw_label = topics["primary_topic"]
        elif isinstance(topics, list) and len(topics) > 0:
            raw_label = topics[0]

        if raw_label:
            target_kpi = CANDIDATE_LABEL_MAP.get(str(raw_label).strip().upper())
            if target_kpi in daily_raw[d_str]:
                daily_raw[d_str][target_kpi]["pos"] += pos_p
                daily_raw[d_str][target_kpi]["neg"] += neg_p
                daily_raw[d_str][target_kpi]["count"] += 1

    if not daily_raw:
        return [], {}, subreddit_name

    df_list = []
    for d_str, kpis in daily_raw.items():
        row_dict = {"date": d_str, "total_posts": kpis["total_daily_posts"]}
        for code in ["ESI", "ISI", "CII", "CCI", "EII"]:
            c = kpis[code]["count"]
            score = 50.0 + 50.0 * ((kpis[code]["pos"] - kpis[code]["neg"]) / c) if c > 0 else 50.0
            row_dict[code] = max(0.0, min(100.0, round(score, 2)))
            row_dict[f"{code}_count"] = c
            row_dict[f"{code}_pos"] = kpis[code]["pos"]
            row_dict[f"{code}_neg"] = kpis[code]["neg"]
        df_list.append(row_dict)

    df = pd.DataFrame(df_list)
    df['date_dt'] = pd.to_datetime(df['date'])
    df = df.sort_values('date_dt').reset_index(drop=True)

    if granularity in ["weekly", "monthly"]:
        rule = "W-MON" if granularity == "weekly" else "MS"
        grouped = df.groupby(pd.Grouper(key='date_dt', freq=rule))
        
        rolled_rows = []
        for name, group in grouped:
            if group.empty:
                continue
            r_dict = {"date": name.strftime('%Y-%m-%d'), "total_posts": int(group["total_posts"].sum())}
            for code in ["ESI", "ISI", "CII", "CCI", "EII"]:
                sum_c = group[f"{code}_count"].sum()
                sum_pos = group[f"{code}_pos"].sum()
                sum_neg = group[f"{code}_neg"].sum()
                score = 50.0 + 50.0 * ((sum_pos - sum_neg) / sum_c) if sum_c > 0 else 50.0
                r_dict[code] = max(0.0, min(100.0, round(score, 2)))
                r_dict[f"{code}_count"] = int(sum_c)
            rolled_rows.append(r_dict)
        df = pd.DataFrame(rolled_rows)
        df['date_dt'] = pd.to_datetime(df['date'])

    for code in ["ESI", "ISI", "CII", "CCI", "EII"]:
        df[f"{code}_SMA"] = df[code].rolling(window=sma_window, min_periods=1).mean().round(2)

    time_series = df.drop(columns=['date_dt']).to_dict(orient="records")

    # Compute overall Pearson r & p-values for hypotheses H1 and H2
    r_h1, p_h1 = calculate_pearson_with_pvalue(df["ESI"], df["CCI"])
    r_h2, p_h2 = calculate_pearson_with_pvalue(df["EII"], df["CII"])

    summary = {
        "mean_ESI": round(df["ESI"].mean(), 2),
        "mean_CCI": round(df["CCI"].mean(), 2),
        "mean_EII": round(df["EII"].mean(), 2),
        "mean_CII": round(df["CII"].mean(), 2),
        "overall_r_ESI_CCI": r_h1,
        "overall_p_ESI_CCI": format_p_value(p_h1),
        "overall_r_EII_CII": r_h2,
        "overall_p_EII_CII": format_p_value(p_h2),
        "total_analyzed_posts": int(df["total_posts"].sum())
    }

    return time_series, summary, subreddit_name