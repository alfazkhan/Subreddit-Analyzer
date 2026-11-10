import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/summary", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    }),
  );
});

test("renders the home dashboard and navigates to project details", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Subreddit Analyzer" })).toBeVisible();
  await page.getByRole("link", { name: "About Project" }).click();
  await expect(page.getByRole("heading", { name: "What is this project even about?" })).toBeVisible();
});

test("opens the KPIs tab without runtime errors while loading and renders hypothesis results", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.route("**/subreddits/sentiments/frequency*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ labels: [], metrics: {} }),
    }),
  );

  await page.route("**/kpis/series*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        summary: { total_analyzed_posts: 120 },
        time_series: [
          {
            date: "2026-01-01",
            post_count: 120,
            avg_negative_sentiment: 0.2,
            avg_neg_sentiment_SMA: 0.2,
            avg_upvote_ratio: 0.85,
            avg_upvote_ratio_SMA: 0.85,
            avg_score: 30,
            avg_num_comments: 8,
          },
        ],
      }),
    });
  });

  await page.route("**/kpis/h*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ hypothesis: {} }),
    });
  });

  await page.route("**/kpis/h1*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        hypothesis: {
          p_neg_vs_num_comments: { n: 120, spearman_rho: 0.35, spearman_p: "< 0.001" },
          p_neg_vs_upvote_ratio: { spearman_rho: -0.2, spearman_p: "= 0.02" },
        },
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("tab", { name: "KPIs" }).click();

  await expect(page.getByText("Social Media Empirical KPIs")).toBeVisible();
  await expect(
    page.getByRole("tabpanel", { name: "Hypothesis 1" }).getByText("HYPOTHESIS PASSED"),
  ).toBeVisible();

  const h1Tab = page.getByRole("tab", { name: "Hypothesis 1" });
  const h2Tab = page.getByRole("tab", { name: "Hypothesis 2" });
  const h1Bg = await h1Tab.evaluate((el) => getComputedStyle(el).backgroundColor);
  const h2Bg = await h2Tab.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(h1Bg).not.toBe("rgb(255, 255, 255)");
  expect(h2Bg).not.toBe("rgb(255, 255, 255)");
  expect(pageErrors).toEqual([]);
});