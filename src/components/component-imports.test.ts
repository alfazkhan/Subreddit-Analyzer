/// <reference types="vite/client" />

import { describe, expect, it, vi } from "vitest";

vi.mock("firebase/auth", () => ({ onAuthStateChanged: vi.fn() }));
vi.mock("../../firebase_config", () => ({ auth: {} }));

const componentModules = Object.entries(import.meta.glob("./**/*.tsx")).filter(
  ([path]) => !path.endsWith(".test.tsx"),
);

describe("component module imports", () => {
  it.each(componentModules)("loads %s", async (_path, loadModule) => {
    const componentModule = (await loadModule()) as Record<string, unknown>;

    expect(Object.keys(componentModule)).not.toHaveLength(0);
  });
});