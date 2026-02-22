const { loadEnv } = require("@medusajs/utils");
loadEnv("test", process.cwd());

module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
          target: "es2022",
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  moduleNameMapper: {
    "^(\\.\\.?\\/.*)\\.js$": "$1",
  },
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],
};

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"];
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/tests/unit/**/*.unit.spec.[jt]s", "**/tests/unit/**/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration:services") {
  module.exports.testMatch = ["**/tests/integration/**/*.integration.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "e2e") {
  module.exports.testMatch = ["**/tests/e2e/**/*.e2e.spec.[jt]s"];
}
