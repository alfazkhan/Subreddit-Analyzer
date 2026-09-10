import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from database.kpis import calculate_db_kpis_timeseries

router = APIRouter(prefix="/kpis", tags=["KPI Analytics Layer"])
logger = logging.getLogger("API-SERVER")

@router.get("")
@router.get("/{subreddit_id}")
async def get_city_kpis(
    subreddit_id: Optional[int] = None,
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    granularity: Optional[str] = Query("daily", description="Time-series aggregation level: 'daily', 'weekly', or 'monthly'"),
    sma_window: Optional[int] = Query(7, ge=1, le=30, description="Simple Moving Average window size in days (1-30)")
):
    """
    Computes Master's Thesis empirical hypothesis statistics (H1, H2, H3) and time-series metrics.
    Works for a specific subreddit (via ID path param) or across all subreddits globally.
    """
    try:
        time_series, summary, subreddit_name = await calculate_db_kpis_timeseries(
            subreddit_id=subreddit_id,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
            sma_window=sma_window
        )

        if subreddit_id and subreddit_name is None:
            raise HTTPException(
                status_code=404, 
                detail=f"Subreddit ID '{subreddit_id}' not found in database."
            )

        return {
            "subreddit_id": subreddit_id,
            "subreddit_name": subreddit_name,
            "start_date": start_date,
            "end_date": end_date,
            "granularity": granularity,
            "sma_window": sma_window,
            "summary": summary,
            "time_series": time_series
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to calculate KPIs: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal Server Error during KPI calculations: {str(e)}"
        )