import json
from typing import Optional
from .core import get_db_pool, safe_parse_timestamp

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

async def calculate_db_kpis_timeseries(
    subreddit_id: int, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    granularity: str = "daily"
):
    pool = await get_db_pool()
    
    # Granularity mapping for PostgreSQL DATE_TRUNC
    gran_clean = granularity.lower().strip()
    if gran_clean == "monthly":
        db_trunc = "month"
    elif gran_clean == "weekly":
        db_trunc = "week"
    else:
        db_trunc = "day"
    
    query = f"""
        SELECT 
            DATE_TRUNC('{db_trunc}', p.timestamp)::date as bucket_date,
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

    query += " ORDER BY bucket_date ASC;"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)

    subreddit_name = None
    if rows:
        subreddit_name = rows[0]["subreddit_name"]
    else:
        async with pool.acquire() as conn:
            subreddit_name = await conn.fetchval("SELECT name FROM subreddits WHERE id = $1", subreddit_id)

    time_series_buckets = {}

    for row in rows:
        date_str = row['bucket_date'].isoformat()
        raw_scores = row['sentiment_scores']
        raw_topics = row['topics']
        
        if date_str not in time_series_buckets:
            time_series_buckets[date_str] = {
                "ESI": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
                "ISI": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
                "CII": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
                "CCI": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
                "EII": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
            }

        scores = json.loads(raw_scores) if isinstance(raw_scores, str) else (raw_scores or {})
        topics = json.loads(raw_topics) if isinstance(raw_topics, str) else (raw_topics or {})
        
        try:
            pos_p = float(scores.get('pos', 0.0) or scores.get('positive', 0.0))
        except (ValueError, TypeError):
            pos_p = 0.0

        try:
            neg_p = float(scores.get('neg', 0.0) or scores.get('negative', 0.0))
        except (ValueError, TypeError):
            neg_p = 0.0

        raw_label = None
        if isinstance(topics, dict) and topics:
            if "labels" in topics and isinstance(topics["labels"], list) and len(topics["labels"]) > 0:
                raw_label = topics["labels"][0]
            elif "primary_topic" in topics:
                raw_label = topics["primary_topic"]
            else:
                clean_topics = {}
                for k, v in topics.items():
                    try:
                        clean_topics[k] = float(v)
                    except (ValueError, TypeError):
                        continue
                if clean_topics:
                    raw_label = max(clean_topics, key=clean_topics.get)
        elif isinstance(topics, list) and len(topics) > 0:
            raw_label = topics[0]

        if raw_label:
            clean_key = str(raw_label).strip().upper()
            target_kpi = CANDIDATE_LABEL_MAP.get(clean_key)
            
            if not target_kpi and clean_key in time_series_buckets[date_str]:
                target_kpi = clean_key

            if target_kpi in time_series_buckets[date_str]:
                time_series_buckets[date_str][target_kpi]["sum_pos"] += pos_p
                time_series_buckets[date_str][target_kpi]["sum_neg"] += neg_p
                time_series_buckets[date_str][target_kpi]["count"] += 1

    return time_series_buckets, subreddit_name