from unittest.mock import AsyncMock

import pytest

import scraper_v2


class FakeLocator:
    def __init__(self, text="", attributes=None, found=True):
        self.text = text
        self.attributes = attributes or {}
        self.found = found
        self.first = self

    async def count(self):
        return int(self.found)

    async def get_attribute(self, name):
        return self.attributes.get(name)

    async def inner_text(self):
        return self.text


class FakePage:
    def __init__(self, title="Example title"):
        self.closed = False
        self.selectors = {
            "shreddit-post": FakeLocator(
                attributes={
                    "score": "42",
                    "comment-count": "5",
                    "upvote-ratio": "0.87654",
                }
            ),
            "h1": FakeLocator(text=title, attributes={"title": title}, found=bool(title)),
            "[post-title]": FakeLocator(found=False),
            "shreddit-title": FakeLocator(found=False),
            "title": FakeLocator(found=False),
            'shreddit-post-text-body, div[data-test-id="post-content"]': FakeLocator(
                text="Example body"
            ),
            "time": FakeLocator(attributes={"datetime": "2026-10-31T12:30:00Z"}),
        }

    def locator(self, selector):
        return self.selectors[selector]

    async def goto(self, *args, **kwargs):
        self.goto_args = (args, kwargs)

    async def wait_for_selector(self, *args, **kwargs):
        return None

    def is_closed(self):
        return self.closed

    async def close(self):
        self.closed = True


class FakeContext:
    def __init__(self, page):
        self.page = page

    async def new_page(self):
        return self.page


@pytest.mark.asyncio
async def test_scrape_post_persists_nlp_and_engagement_fields(monkeypatch):
    page = FakePage()
    context = FakeContext(page)
    queue_status = AsyncMock()
    save_post = AsyncMock()
    monkeypatch.setattr(scraper_v2, "update_queue_status", queue_status)
    monkeypatch.setattr(scraper_v2, "save_post_to_db", save_post)
    monkeypatch.setattr(
        scraper_v2,
        "get_sentiment",
        lambda text: {"label": "Positive", "scores": {"positive": 0.9}},
    )
    monkeypatch.setattr(
        scraper_v2, "extract_keywords", lambda text, ignored: {"example": 1}
    )
    monkeypatch.setattr(
        scraper_v2, "extract_entities", lambda text: [{"text": "Berlin", "label": "GPE"}]
    )
    monkeypatch.setattr(
        scraper_v2,
        "classify_topics",
        lambda text: {"primary_topic": "Community Discussion"},
    )

    result = await scraper_v2.scrape_post_by_id(
        context, "t3_post-1", "Berlin", {"ignored"}
    )

    assert result["id"] == "t3_post-1"
    assert result["title"] == "Example title"
    assert result["body"] == "Example body"
    assert result["score"] == 42
    assert result["num_comments"] == 5
    assert result["upvote_ratio"] == 0.877
    assert result["sentiment"] == "Positive"
    assert result["keywords"] == {"example": 1}
    assert queue_status.await_args_list[0].args == ("t3_post-1", "processing")
    assert queue_status.await_args_list[1].args == ("t3_post-1", "completed")
    save_post.assert_awaited_once_with(result, "Berlin")
    assert page.closed is True


@pytest.mark.asyncio
async def test_scrape_post_marks_missing_title_as_failed(monkeypatch):
    page = FakePage(title="")
    queue_status = AsyncMock()
    save_post = AsyncMock()
    monkeypatch.setattr(scraper_v2, "update_queue_status", queue_status)
    monkeypatch.setattr(scraper_v2, "save_post_to_db", save_post)

    result = await scraper_v2.scrape_post_by_id(
        FakeContext(page), "post-2", "Berlin", set()
    )

    assert result is None
    assert queue_status.await_args_list[-1].args == ("post-2", "failed")
    save_post.assert_not_awaited()
    assert page.closed is True


@pytest.mark.asyncio
async def test_process_queue_returns_zero_without_launching_browser(monkeypatch):
    monkeypatch.setattr(scraper_v2, "get_queue_tasks_by_status", _async_return([]))

    result = await scraper_v2.process_queue_batch("Berlin")

    assert result == 0


@pytest.mark.asyncio
async def test_post_metadata_returns_id_and_timestamp():
    class Post:
        async def get_attribute(self, name):
            return "post-1" if name == "id" else None

        def locator(self, selector):
            return FakeLocator(attributes={"datetime": "2026-10-31T12:30:00Z"})

    assert await scraper_v2.get_post_metadata(Post()) == (
        "post-1",
        "2026-10-31T12:30:00Z",
    )


def _async_return(value):
    return AsyncMock(return_value=value)
