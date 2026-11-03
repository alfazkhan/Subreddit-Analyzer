import pytest

import nlp_processor


def test_empty_sentiment_is_neutral_without_loading_a_model(monkeypatch):
    monkeypatch.setattr(
        nlp_processor,
        "get_sentiment_pipeline",
        lambda: pytest.fail("The model should not load for empty text"),
    )

    assert nlp_processor.get_sentiment("  ") == {
        "label": "Neutral",
        "scores": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
    }


def test_sentiment_maps_model_scores(monkeypatch):
    monkeypatch.setattr(
        nlp_processor,
        "get_sentiment_pipeline",
        lambda: lambda text, **kwargs: [
            {"label": "positive", "score": 0.89126},
            {"label": "neutral", "score": 0.07891},
            {"label": "negative", "score": 0.02983},
        ],
    )

    result = nlp_processor.get_sentiment("A deterministic test post")

    assert result == {
        "label": "Positive",
        "scores": {"positive": 0.8913, "neutral": 0.0789, "negative": 0.0298},
    }


def test_keyword_extraction_excludes_stopwords_and_ignored_words(monkeypatch):
    class Lemmatizer:
        def lemmatize(self, word):
            return word

    monkeypatch.setattr(nlp_processor, "word_tokenize", lambda text: ["the", "reddit", "posts", "analysis"])
    monkeypatch.setattr(nlp_processor, "ENGLISH_STOPWORDS", {"the"})
    monkeypatch.setattr(nlp_processor, "lemmatizer", Lemmatizer())

    assert nlp_processor.extract_keywords("unused", {"reddit"}) == {"posts": 1, "analysis": 1}


def test_entity_extraction_deduplicates_and_filters_labels(monkeypatch):
    class Entity:
        def __init__(self, text, label):
            self.text = text
            self.label_ = label

    class Model:
        def __call__(self, text):
            assert text == "Berlin Berlin unsupported"
            return type(
                "Document",
                (),
                {
                    "ents": [
                        Entity("Berlin", "GPE"),
                        Entity(" berlin ", "GPE"),
                        Entity("x", "ORG"),
                        Entity("unknown", "CUSTOM"),
                    ]
                },
            )()

    monkeypatch.setattr(nlp_processor, "get_spacy_models", lambda: (Model(), None))

    assert nlp_processor.extract_entities(" Berlin Berlin unsupported ") == [
        {"text": "Berlin", "label": "GPE"}
    ]


def test_topic_classification_empty_text_does_not_load_model(monkeypatch):
    monkeypatch.setattr(
        nlp_processor,
        "get_classifier_pipeline",
        lambda: pytest.fail("The model should not load for empty text"),
    )

    assert nlp_processor.classify_topics("") == {
        "labels": [],
        "scores": [],
        "primary_topic": "Community Discussion",
    }


def test_topic_classification_returns_ordered_labels_and_rounded_scores(monkeypatch):
    monkeypatch.setattr(
        nlp_processor,
        "get_classifier_pipeline",
        lambda: lambda text, **kwargs: {
            "labels": ["Rent Prices & Affordability", "Other"],
            "scores": [0.87654, 0.12346],
        },
    )

    result = nlp_processor.classify_topics("A post about rent")

    assert result == {
        "labels": ["Rent Prices & Affordability", "Other"],
        "scores": [0.877, 0.123],
        "primary_topic": "Rent Prices & Affordability",
    }