from datetime import date, datetime

import pandas as pd
import pytest

from database import kpis


def test_format_p_value_handles_missing_small_and_rounded_values():
    assert kpis.format_p_value(float("nan")) == "= 1.0"
    assert kpis.format_p_value(0.0005) == "< 0.001"
    assert kpis.format_p_value(0.123456) == "= 0.1235"


def test_hypothesis_helpers_handle_empty_and_insufficient_data():
    assert pd.isna(kpis.calculate_shannon_entropy([]))
    assert pd.isna(kpis.calculate_shannon_entropy([0, 0]))
    assert kpis.calculate_ttr({}, 4) == 0.0
    assert kpis.calculate_ttr({"one": 1, "two": 1}, 1) == 1.0

    result = kpis.calculate_correlations(
        pd.Series([1, 2, 3]),
        pd.Series([3, 2, 1]),
    )

    assert result == {
        "n": 3,
        "pearson_r": 0.0,
        "pearson_p": "= 1.0",
        "spearman_rho": 0.0,
        "spearman_p": "= 1.0",
    }


@pytest.mark.asyncio
async def test_kpi_calculation_returns_empty_result_without_rows(fake_db):
    fake_db.fetch.return_value = []

    time_series, summary, name = await kpis.calculate_db_kpis_timeseries()

    assert time_series == []
    assert summary == {}
    assert name == "All Subreddits"


@pytest.mark.asyncio
async def test_kpi_calculation_builds_metrics_and_time_series(fake_db):
    fake_db.fetch.return_value = [
        {
            "id": "post-1",
            "post_date": date(2026, 10, 31),
            "timestamp": datetime(2026, 10, 31, 12),
            "title": "Rent increase",
            "body": "Monthly rent increased",
            "score": 12,
            "upvote_ratio": 0.8,
            "num_comments": 4,
            "sentiment": "Negative",
            "sentiment_scores": {"positive": 0.1, "neutral": 0.2, "negative": 0.7},
            "topics": {
                "primary_topic": "Rent Prices & Affordability",
                "scores": [0.8, 0.2],
            },
            "keywords": {"rent": 2},
            "entities": [{"text": "$100", "label": "MONEY"}],
            "subreddit_name": "Berlin",
            "total_users": 500,
            "timezone": "UTC",
        }
    ]

    time_series, summary, name = await kpis.calculate_db_kpis_timeseries(
        subreddit_id=3,
        start_date="2026-10-01",
        end_date="2026-10-31",
    )

    assert name == "Berlin"
    assert summary["total_analyzed_posts"] == 1
    assert summary["overall_mean_negative_sentiment"] == 0.7
    assert time_series[0]["post_count"] == 1
    assert time_series[0]["admin_topic_count"] == 1
    assert time_series[0]["avg_neg_sentiment_SMA"] == 0.7
    query, *args = fake_db.fetch.await_args.args
    assert "p.subreddit_id = $1" in query
    assert args == [3, datetime(2026, 10, 1), datetime(2026, 10, 31)]


@pytest.mark.asyncio
async def test_kpi_calculation_resolves_name_when_requested_subreddit_has_no_posts(fake_db):
    fake_db.fetch.return_value = []
    fake_db.fetchval.return_value = "Berlin"

    time_series, summary, name = await kpis.calculate_db_kpis_timeseries(
        subreddit_id=3
    )

    assert time_series == []
    assert summary == {}
    assert name == "Berlin"
    fake_db.fetchval.assert_awaited_once_with(
        "SELECT name FROM subreddits WHERE id = $1", 3
    )


@pytest.mark.asyncio
async def test_kpi_calculation_can_skip_hypothesis_tests_for_chart_series(fake_db):
    fake_db.fetch.return_value = [
        {
            "id": "post-1",
            "post_date": date(2026, 10, 31),
            "timestamp": datetime(2026, 10, 31, 12),
            "title": "Rent increase",
            "body": "Monthly rent increased",
            "score": 12,
            "upvote_ratio": 0.8,
            "num_comments": 4,
            "sentiment_scores": {"positive": 0.1, "neutral": 0.2, "negative": 0.7},
            "topics": {"primary_topic": "Rent Prices & Affordability", "scores": [0.8, 0.2]},
            "keywords": {"rent": 2},
            "entities": [{"label": "MONEY"}],
            "subreddit_name": "Berlin",
            "total_users": 500,
            "timezone": "UTC",
        }
    ]

    time_series, summary, name = await kpis.calculate_db_kpis_timeseries(
        include_hypothesis_tests=False
    )

    assert name == "All Subreddits"
    assert time_series[0]["post_count"] == 1
    assert summary["hypothesis_tests"] == {}
