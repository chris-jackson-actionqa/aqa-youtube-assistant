import { afterEach, describe, expect, it, jest } from "@jest/globals";

const originalEnv = process.env.NEXT_PUBLIC_API_URL;

describe("API base URL configuration", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("uses NEXT_PUBLIC_API_URL when set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    const mockFetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] });
    (global as typeof globalThis).fetch = mockFetch;

    const { getProjects } = await import("../api");
    await getProjects();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/api/projects",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Workspace-Id": "1",
        }),
      })
    );
  });

  it("falls back to localhost when env var is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const mockFetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] });
    (global as typeof globalThis).fetch = mockFetch;

    const { checkHealth } = await import("../api");
    await checkHealth();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/health",
      expect.any(Object)
    );
  });
});
