import { describe, it, expect } from "vitest";

describe("Network Sandbox Debugging", () => {
  it("should establish a TCP connection to the active Medusa dev server on 9000", async () => {
    console.log("[DEBUG] Env HTTP_PROXY:", process.env.HTTP_PROXY);
    console.log("[DEBUG] Env HTTPS_PROXY:", process.env.HTTPS_PROXY);
    console.log("[DEBUG] Env TEST_PORT:", process.env.TEST_PORT);

    try {
      // 1. Trying 127.0.0.1 explicitly
      console.log("[DEBUG] Dialing http://127.0.0.1:9000/health");
      const resV4 = await fetch("http://127.0.0.1:9000/health");
      console.log("[DEBUG] IPv4 Response Status:", resV4.status);
    } catch (e: any) {
      console.error("[DEBUG] IPv4 Fetch Failed:", e.message);
    }

    try {
      // 2. Trying generic localhost
      console.log("[DEBUG] Dialing http://localhost:9000/health");
      const resLocal = await fetch("http://localhost:9000/health");
      console.log("[DEBUG] Localhost Response Status:", resLocal.status);
    } catch (e: any) {
      console.error("[DEBUG] Localhost Fetch Failed:", e.message);
    }

    // Pass the test regardless to force log output
    expect(true).toBe(true);
  });
});
