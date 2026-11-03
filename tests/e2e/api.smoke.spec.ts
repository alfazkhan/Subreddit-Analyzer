import { expect, test } from "@playwright/test";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const readOnlyEndpoints = [
  "/summary",
  "/posts?limit=1",
  "/posts/keywords?limit=1",
  "/posts/frequency",
  "/subreddits",
  "/subreddits/sentiments",
  "/subreddits/sentiments/frequency",
  "/queue",
  "/kpis?granularity=daily&start_date=2026-10-30&end_date=2026-10-31",
];

test.describe("read-only backend API smoke tests", () => {
  test.skip(
    process.env.RUN_API_INTEGRATION !== "true",
    "Set RUN_API_INTEGRATION=true to check a running local backend.",
  );

  for (const endpoint of readOnlyEndpoints) {
    test(`GET ${endpoint} returns JSON`, async ({ request }) => {
      const isKpiEndpoint = endpoint.startsWith("/kpis");
      if (isKpiEndpoint) test.setTimeout(120_000);

      const response = await request.get(`${apiBaseUrl}${endpoint}`, {
        timeout: isKpiEndpoint ? 120_000 : 30_000,
      });

      expect(response.ok(), `${endpoint} returned ${response.status()}`).toBeTruthy();
      expect(response.headers()["content-type"]).toContain("application/json");
      await expect(response.json()).resolves.toBeDefined();
    });
  }
});