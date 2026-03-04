/**
 * Temporal Config & Env Validation — Unit Tests
 *
 * Tests appConfig.temporal and appConfig.waltid backward-compat getters,
 * env variable reading order, and the isConfigured flags.
 *
 * Run: pnpm --filter backend test:unit
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ENV_BACKUP: Record<string, string | undefined> = {};
const TEMPORAL_VARS = [
  "TEMPORAL_ADDRESS",
  "TEMPORAL_NAMESPACE",
  "TEMPORAL_API_KEY",
  "TEMPORAL_TASK_QUEUE",
  "TEMPORAL_AUTO_START",
];
const WALTID_VARS = [
  "WALT_ID_ISSUER_URL",
  "WALT_ID_VERIFIER_URL",
  "WALT_ID_API_KEY",
  "WALT_ID_DID",
  "WALTID_URL_DEV",
  "WALTID_API_KEY",
];

function setEnv(vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) {
    ENV_BACKUP[k] = process.env[k];
    process.env[k] = v;
  }
}

function restoreEnv() {
  for (const [k, v] of Object.entries(ENV_BACKUP)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

beforeEach(() => {
  for (const k of [...TEMPORAL_VARS, ...WALTID_VARS]) {
    ENV_BACKUP[k] = process.env[k];
    delete process.env[k];
  }
  vi.resetModules();
});

afterEach(() => {
  restoreEnv();
});

// ── Temporal config ────────────────────────────────────────────────────────
describe("appConfig.temporal", () => {
  it("reads TEMPORAL_ADDRESS correctly", async () => {
    setEnv({ TEMPORAL_ADDRESS: "ap-northeast-1.aws.api.temporal.io:7233" });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.temporal.address).toBe(
      "ap-northeast-1.aws.api.temporal.io:7233",
    );
  });

  it("backward-compat: .endpoint returns same as .address", async () => {
    setEnv({ TEMPORAL_ADDRESS: "ap-northeast-1.aws.api.temporal.io:7233" });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.temporal.endpoint).toBe(appConfig.temporal.address);
  });

  it("reads TEMPORAL_NAMESPACE correctly", async () => {
    setEnv({ TEMPORAL_NAMESPACE: "quickstart-dakkah-cityos.djvai" });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.temporal.namespace).toBe("quickstart-dakkah-cityos.djvai");
  });

  it("reads TEMPORAL_API_KEY correctly", async () => {
    setEnv({ TEMPORAL_API_KEY: "my-secret-key" });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.temporal.apiKey).toBe("my-secret-key");
  });

  it("defaults TEMPORAL_TASK_QUEUE to uce-commerce-financial when not set", async () => {
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.temporal.taskQueue).toBe("uce-commerce-financial");
  });

  it("isConfigured=true when address + namespace + apiKey all set", async () => {
    setEnv({
      TEMPORAL_ADDRESS: "ap-northeast-1.aws.api.temporal.io:7233",
      TEMPORAL_NAMESPACE: "quickstart-dakkah-cityos.djvai",
      TEMPORAL_API_KEY: "key",
    });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.temporal.isConfigured).toBe(true);
  });

  it("isConfigured=false when any required var is missing", async () => {
    setEnv({
      TEMPORAL_ADDRESS: "ap-northeast-1.aws.api.temporal.io:7233",
      // Missing namespace and apiKey
    });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.temporal.isConfigured).toBe(false);
  });

  it("isConfigured=false when all vars are empty", async () => {
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.temporal.isConfigured).toBe(false);
  });
});

// ── Walt.id config ─────────────────────────────────────────────────────────
describe("appConfig.waltid", () => {
  it("reads WALT_ID_ISSUER_URL as primary issuerUrl", async () => {
    setEnv({ WALT_ID_ISSUER_URL: "https://issuer.walt.id" });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.waltid.issuerUrl).toBe("https://issuer.walt.id");
  });

  it("falls back to WALTID_URL_DEV if WALT_ID_ISSUER_URL not set", async () => {
    setEnv({ WALTID_URL_DEV: "http://localhost:8080" });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.waltid.issuerUrl).toBe("http://localhost:8080");
  });

  it("backward-compat: .url returns same as .issuerUrl", async () => {
    setEnv({ WALT_ID_ISSUER_URL: "https://issuer.walt.id" });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.waltid.url).toBe(appConfig.waltid.issuerUrl);
  });

  it("reads WALT_ID_API_KEY as primary apiKey", async () => {
    setEnv({ WALT_ID_API_KEY: "waltkey123" });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.waltid.apiKey).toBe("waltkey123");
  });

  it("isConfigured=true when api key is present", async () => {
    setEnv({ WALT_ID_API_KEY: "waltkey123" });
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.waltid.isConfigured).toBe(true);
  });

  it("isConfigured=false when no api key", async () => {
    vi.resetModules();
    const { appConfig } = await import("../../lib/config");
    expect(appConfig.waltid.isConfigured).toBe(false);
  });
});

// ── Correct endpoint format validation ─────────────────────────────────────
describe("Temporal Cloud endpoint format", () => {
  it("regional endpoint format: {region}.aws.api.temporal.io:7233", () => {
    const endpoint = "ap-northeast-1.aws.api.temporal.io:7233";
    expect(endpoint).toMatch(/^[a-z-0-9]+\.aws\.api\.temporal\.io:7233$/);
  });

  it("namespace format: {name}.{accountId}", () => {
    const namespace = "quickstart-dakkah-cityos.djvai";
    expect(namespace).toMatch(/^[a-z0-9-]+\.[a-z0-9]+$/);
  });

  it("old tmprl.cloud format is NOT valid for this account", () => {
    const invalidEndpoint = "djvai.a2dd6.tmprl.cloud:7233";
    // This hostname does not resolve — it was a mistake in our earlier env
    expect(invalidEndpoint).toContain("djvai.a2dd6"); // documents the wrong value
    expect(invalidEndpoint).not.toContain("aws.api.temporal.io");
  });

  it("valid task queues follow uce-commerce-{domain} pattern", () => {
    const validQueues = [
      "uce-commerce-financial",
      "uce-commerce-dispatch",
      "uce-commerce-recurring",
      "uce-commerce-fulfilment",
    ];
    for (const queue of validQueues) {
      expect(queue).toMatch(
        /^uce-commerce-(financial|dispatch|recurring|fulfilment)$/,
      );
    }
  });
});

// ── ENV file completeness check (documents required vars) ──────────────────
describe("Required environment variables spec", () => {
  const REQUIRED_FOR_TEMPORAL = [
    "TEMPORAL_ADDRESS",
    "TEMPORAL_NAMESPACE",
    "TEMPORAL_API_KEY",
  ];

  const REQUIRED_FOR_INTEGRATIONS = [
    "ERPNEXT_URL",
    "FLEETBASE_API_URL",
    "WALT_ID_ISSUER_URL",
    "WALT_ID_API_KEY",
    "PAYLOAD_CMS_URL",
    "PAYLOAD_API_KEY",
  ];

  it("documents the 3 required Temporal vars", () => {
    expect(REQUIRED_FOR_TEMPORAL).toHaveLength(3);
    expect(REQUIRED_FOR_TEMPORAL).toContain("TEMPORAL_ADDRESS");
    expect(REQUIRED_FOR_TEMPORAL).toContain("TEMPORAL_NAMESPACE");
    expect(REQUIRED_FOR_TEMPORAL).toContain("TEMPORAL_API_KEY");
  });

  it("documents the 6 required integration vars", () => {
    expect(REQUIRED_FOR_INTEGRATIONS).toHaveLength(6);
  });
});
