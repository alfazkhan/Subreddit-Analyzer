import json

import numpy as np
import pytest

from test_advanced_hypotheses import (
    calculate_shannon_entropy,
    calculate_ttr,
    parse_sentiment_score,
)


def test_hypothesis_entropy_normalizes_valid_topic_scores():
    entropy = calculate_shannon_entropy({"scores": [0.5, 0.5]})

    assert entropy == pytest.approx(np.log(2))


@pytest.mark.parametrize(
    "topic",
    [
        None,
        {},
        {"scores": []},
        {"scores": [0, 0]},
        "{invalid",
        json.dumps({"scores": [0, 0]}),
    ],
)
def test_hypothesis_entropy_handles_missing_and_invalid_scores(topic):
    assert np.isnan(calculate_shannon_entropy(topic))


def test_hypothesis_ttr_uses_distinct_keyword_count():
    assert calculate_ttr({"one": 1, "two": 2}, 10) == 0.2
    assert calculate_ttr({"one": 1, "two": 2}, 1) == 2.0
    assert calculate_ttr({}, 10) == 0.0
    assert calculate_ttr({"one": 1}, 0) == 0.0


def test_hypothesis_ttr_parses_serialized_keyword_objects():
    assert calculate_ttr('{"one": 1, "two": 1}', 4) == 0.5
    assert calculate_ttr("{invalid", 4) == 0.0


def test_hypothesis_sentiment_score_supports_dict_and_json():
    assert parse_sentiment_score({"negative": 0.7}, "negative") == 0.7
    assert parse_sentiment_score('{"positive": 0.8}', "positive") == 0.8
    assert parse_sentiment_score('{"positive": 0.8}', "negative") == 0.0


def test_hypothesis_sentiment_score_handles_malformed_and_non_dict_values():
    assert parse_sentiment_score(None, "positive") == 0.0
    assert parse_sentiment_score("{invalid", "positive") == 0.0
    assert parse_sentiment_score(["not", "a", "mapping"], "positive") == 0.0
