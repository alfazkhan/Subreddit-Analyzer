import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from database.kpis import calculate_db_kpis_timeseries

router = APIRouter(prefix="/kpis", tags=["KPI Analytics Layer"])
logger = logging.getLogger("API-SERVER")

KPI_KEYS = {f"h{index}" for index in range(1, 8)}

def _query_parameters(
    start_date: Optional[str],
    end_date: Optional[str],
    granularity: str,
    sma_window: int,
):
    return {
        "start_date": start_date,
        "end_date": end_date,
        "granularity": granularity,
        "sma_window": sma_window,
    }

async def _calculate_kpis(
    subreddit_id: Optional[int],
    start_date: Optional[str],
    end_date: Optional[str],
    granularity: str,
    sma_window: int,
    include_hypothesis_tests: bool,
):
    return await calculate_db_kpis_timeseries(
        subreddit_id=subreddit_id,
        start_date=start_date,
        end_date=end_date,
        granularity=granularity,
        sma_window=sma_window,
        include_hypothesis_tests=include_hypothesis_tests,
    )

def _response_metadata(
    subreddit_id: Optional[int],
    subreddit_name: Optional[str],
    start_date: Optional[str],
    end_date: Optional[str],
    granularity: str,
    sma_window: int,
):
    return {
        "subreddit_id": subreddit_id,
        "subreddit_name": subreddit_name,
        **_query_parameters(start_date, end_date, granularity, sma_window),
    }

async def _get_hypothesis(
    hypothesis_key: str,
    subreddit_id: Optional[int],
    start_date: Optional[str],
    end_date: Optional[str],
    granularity: str,
    sma_window: int,
):
    try:
        time_series, summary, subreddit_name = await _calculate_kpis(
            subreddit_id,
            start_date,
            end_date,
            granularity,
            sma_window,
            True,
        )
        if subreddit_id and subreddit_name is None:
            raise HTTPException(
                status_code=404,
                detail=f"Subreddit ID '{subreddit_id}' not found in database.",
            )

        hypothesis = next(
            (
                value.get(hypothesis_key.upper())
                for value in summary.get("hypothesis_tests", {}).values()
                if hypothesis_key.upper() in value
            ),
            None,
        )
        return JSONResponse(content={
            **_response_metadata(
                subreddit_id, subreddit_name, start_date, end_date, granularity, sma_window
            ),
            "hypothesis": hypothesis or {},
            "summary": {
                "total_analyzed_posts": summary.get("total_analyzed_posts", 0)
            },
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to calculate {hypothesis_key.upper()}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error during {hypothesis_key.upper()} calculation: {str(e)}",
        )

@router.get("/series")
@router.get("/series/{subreddit_id}")
async def get_kpi_series(
    subreddit_id: Optional[int] = None,
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    granularity: str = Query("daily", description="Time-series aggregation level: 'daily', 'weekly', or 'monthly'"),
    sma_window: int = Query(7, ge=1, le=30, description="Simple Moving Average window size in days (1-30)"),
):
    time_series, summary, subreddit_name = await _calculate_kpis(
        subreddit_id, start_date, end_date, granularity, sma_window, False
    )
    if subreddit_id and subreddit_name is None:
        raise HTTPException(
            status_code=404,
            detail=f"Subreddit ID '{subreddit_id}' not found in database.",
        )
    return JSONResponse(content={
        **_response_metadata(
            subreddit_id, subreddit_name, start_date, end_date, granularity, sma_window
        ),
        "summary": summary,
        "time_series": time_series,
    })

def _make_hypothesis_handler(hypothesis_key: str):
    async def handler(
        subreddit_id: Optional[int] = Query(None),
        start_date: Optional[str] = Query(None),
        end_date: Optional[str] = Query(None),
        granularity: str = Query("daily"),
        sma_window: int = Query(7, ge=1, le=30),
    ):
        return await _get_hypothesis(
            hypothesis_key,
            subreddit_id,
            start_date,
            end_date,
            granularity,
            sma_window,
        )

    handler.__name__ = f"get_{hypothesis_key}_kpi"
    return handler

for _hypothesis_key in sorted(KPI_KEYS):
    router.add_api_route(
        f"/{_hypothesis_key}",
        _make_hypothesis_handler(_hypothesis_key),
        methods=["GET"],
        name=f"get_{_hypothesis_key}_kpi",
    )

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
    Computes Master's Thesis empirical hypothesis statistics organized across the 4 Academic Pillars (H1-H7)
    and time-series metrics globally or per municipal subreddit.
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

        return JSONResponse(content={
            "subreddit_id": subreddit_id,
            "subreddit_name": subreddit_name,
            "start_date": start_date,
            "end_date": end_date,
            "granularity": granularity,
            "sma_window": sma_window,
            "summary": summary,
            "time_series": time_series
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to calculate KPIs: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal Server Error during KPI calculations: {str(e)}"
        )