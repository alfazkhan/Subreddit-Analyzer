import { afterEach, describe, expect, it, vi } from "vitest";
import { BASE_URL } from "@/Constants";
import {
  deletingData,
  editingData,
  fetchingData,
  sendingData,
} from "./http";

vi.mock("firebase/auth", () => ({ onAuthStateChanged: vi.fn() }));
vi.mock("../../firebase_config", () => ({ auth: {} }));

const jsonResponse = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HTTP API helpers", () => {
  it("fetches and parses a JSON resource", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchingData({ endpoint: "posts", headers: {} })).resolves.toEqual({
      items: [],
    });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/posts`, { headers: {} });
  });

  it("surfaces backend errors from GET responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Unavailable" }, 503)));

    await expect(fetchingData({ endpoint: "summary", headers: {} })).rejects.toMatchObject({
      message: "Unavailable",
      status: 503,
    });
  });

  it("sends JSON payloads with POST", async () => {
    const payload = [{ word: "example", language: "en" }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ accepted: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendingData({ endpoint: "ignored-words", body: payload, headers: {} }),
    ).resolves.toEqual({ accepted: true });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/ignored-words`, {
      method: "POST",
      signal: undefined,
      body: JSON.stringify(payload),
      headers: {},
    });
  });

  it("uses PUT and DELETE for mutations", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await editingData({ endpoint: "subreddits/demo", body: { is_active: false }, headers: {} });
    await deletingData({ endpoint: "subreddits/demo", headers: {} });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "PUT",
      body: JSON.stringify({ is_active: false }),
    });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "DELETE" });
  });
});