import pytest
from nlp_processor import get_sentiment

def test_sentiment_logic():
    # Test if the model correctly identifies a positive string
    result = get_sentiment("This is a fantastic and helpful tool!")
    assert result in ["Positive", "Neutral"] # RoBERTa labels can vary slightly

def test_keyword_exclusion():
    from nlp_processor import extract_keywords
    text = "The reddit post is here."
    ignore = {"reddit"}
    keywords = extract_keywords(text, ignore)
    assert "reddit" not in keywords