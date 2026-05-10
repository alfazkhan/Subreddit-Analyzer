import pytest

def test_config_exports():
    """Ensure all required settings are in config.py."""
    import config
    assert hasattr(config, "IGNORE_WORDS")
    assert hasattr(config, "DB_CONFIG")

def test_nlp_exports():
    """Ensure NLP functions are available."""
    import nlp_processor
    assert hasattr(nlp_processor, "get_sentiment")
    assert hasattr(nlp_processor, "extract_keywords")

def test_scraper_imports():
    """Check if scraper can initialize without ImportError."""
    try:
        import scraper
    except ImportError as e:
        pytest.fail(f"Scraper import failed: {e}")