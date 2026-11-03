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