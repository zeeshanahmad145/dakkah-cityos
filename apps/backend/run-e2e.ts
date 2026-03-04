import { execSync } from "child_process";

async function main() {
  console.log("Starting custom E2E Test Suite...");
  console.log(
    "NOTE: This runner assumes 'npm run dev' is already running in another terminal on Port 9000.",
  );

  try {
    console.log("Running Vitest API integration tests...");

    // We execute vitest and point it cleanly to the integration tests
    execSync(
      "npx vitest run tests/integration/automotive.spec.ts --no-color --config=false",
      {
        stdio: "inherit",
        env: { ...process.env, TEST_PORT: "9000" },
      },
    );
  } catch (error) {
    console.error("Test Suite Failed:", error);
    process.exitCode = 1;
  }
}

main();
