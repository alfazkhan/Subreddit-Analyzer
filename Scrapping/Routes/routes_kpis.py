import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from database.kpis import calculate_db_kpis_timeseries

router = APIRouter(prefix="/kpis", tags=["KPI Analytics Layer"])
logger = logging.getLogger("API-SERVER")

@router.get("/{subreddit_id}")
async def get_city_kpis(
    subreddit_id: int,
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    granularity: Optional[str] = Query("daily", description="Time-series aggregation level: 'daily', 'weekly', or 'monthly'")
):
    """
    Calculates the 5 Core Net Sentiment Indices for a specified city ID, returning overall aggregates
    and a bucketed time-series array (daily, weekly, monthly) for charts and hypothesis testing (H1 & H2).
    """
    try:
        buckets, subreddit_name = await calculate_db_kpis_timeseries(
            subreddit_id, start_date, end_date, granularity
        )

        if subreddit_name is None:
            raise HTTPException(status_code=404, detail=f"Subreddit ID '{subreddit_id}' not found.")

        global_stats = {
            "ESI": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
            "ISI": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
            "CII": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
            "CCI": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
            "EII": {"sum_pos": 0.0, "sum_neg": 0.0, "count": 0},
        }

        time_series_list = []
        total_posts_analyzed = 0

        for date_str, kpi_data in buckets.items():
            interval_entry = {"date": date_str}
            
            for code, stats in kpi_data.items():
                count = stats["count"]
                sum_pos = stats["sum_pos"]
                sum_neg = stats["sum_neg"]

                global_stats[code]["sum_pos"] += sum_pos
                global_stats[code]["sum_neg"] += sum_neg
                global_stats[code]["count"] += count
                total_posts_analyzed += count

                if count > 0:
                    raw_score = 50.0 + 50.0 * ((sum_pos - sum_neg) / count)
                    score = max(0.0, min(100.0, round(raw_score, 2)))
                else:
                    score = 50.0

                interval_entry[code] = score
                interval_entry[f"{code}_posts"] = count

            time_series_list.append(interval_entry)

        kpi_mappings = {
            "ESI": "economic_sentiment_index",
            "ISI": "infrastructure_services_index",
            "CII": "local_consumer_intent_index",
            "CCI": "community_concern_safety_index",
            "EII": "expat_integration_index"
        }

        overall_kpis = {}
        for code, full_key in kpi_mappings.items():
            g_count = global_stats[code]["count"]
            g_pos = global_stats[code]["sum_pos"]
            g_neg = global_stats[code]["sum_neg"]

            if g_count > 0:
                raw_score = 50.0 + 50.0 * ((g_pos - g_neg) / g_count)
                g_score = max(0.0, min(100.0, round(raw_score, 2)))
            else:
                g_score = 50.0

            overall_kpis[full_key] = {
                "code": code,
                "score": g_score,
                "total_posts": g_count
            }

        return {
            "subreddit_id": subreddit_id,
            "subreddit_name": subreddit_name,
            "start_date": start_date,
            "end_date": end_date,
            "granularity": granularity,
            "total_posts_analyzed": total_posts_analyzed,
            "summary_kpis": overall_kpis,
            "time_series": time_series_list
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to calculate time-series KPIs for subreddit ID '{subreddit_id}': {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error during KPI time-series calculations.")