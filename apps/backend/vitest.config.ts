export default async () => {
  const { defineConfig } = await import("vitest/config");

  return defineConfig({
    test: {
      // Makes describe, it, expect, vi available globally (no imports needed)
      // This is required for the many .spec.ts files written in Jest style
      globals: true,

      environment: "node",

      // Include all test patterns:
      // - src/__tests__/**  (our vitest-native tests)
      // - tests/**          (route/unit tests written in Jest style)
      // - integration-tests/** (integration tests)
      // Exclude actual medusa integration test runner files (medusaIntegrationTestRunner)
      // since those need a running Medusa server
      include: [
        "src/__tests__/**/*.spec.ts",
        "tests/**/*.spec.ts",
        "tests/**/*.test.ts",
        "tests/integration/**/*.spec.ts",
      ],

      // Exclude tests requiring a live Medusa server/database
      exclude: ["**/node_modules/**"],

      // jest → vi global alias: so `jest.fn()` works as `vi.fn()`, etc.
      // This is done via a setup file that patches the global `jest` object
      setupFiles: ["./vitest.setup.ts"],

      // Timeout for individual tests
      testTimeout: 30_000,

      // Reporter
      reporters: process.env.CI ? "default" : "verbose",
    },
  });
};
