def test_config_exports():
    """Ensure the database and scraper settings are available."""
    import config
    assert hasattr(config, "DB_CONFIG")
    assert {"host", "port", "database", "user", "password"} <= set(config.DB_CONFIG)
    assert config.MAX_CONCURRENT_TABS > 0

def test_nlp_exports():
    import nlp_processor
    assert hasattr(nlp_processor, "get_sentiment")
    assert hasattr(nlp_processor, "extract_keywords")
    assert hasattr(nlp_processor, "extract_entities")
    assert hasattr(nlp_processor, "classify_topics")

def test_scraper_imports():
    """Import the current scraper module without launching a browser."""
    import scraper_v2
    assert callable(scraper_v2.run_discovery_scan)
    assert callable(scraper_v2.process_queue_batch)