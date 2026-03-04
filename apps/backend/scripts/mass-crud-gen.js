const fs = require("fs");
const path = require("path");

const apiDir = path.join(__dirname, "../src/api/admin");
const testsDir = path.join(__dirname, "../tests/integration");

function parseZodSchema(code) {
  const fields = {};

  // Match the first Zod object inside the file (usually the create payload)
  const schemaMatch = code.match(/z\.object\(\s*\{([\s\S]*?)\}\s*\)/);
  if (!schemaMatch) return fields;

  const schemaBody = schemaMatch[1];

  const propRegex = /([a-zA-Z0-9_]+)\s*:\s*z\.([a-zA-Z]+)\(/g;
  let match;
  while ((match = propRegex.exec(schemaBody)) !== null) {
    const field = match[1];
    const type = match[2];

    if (field === "tenant_id") fields[field] = "test-tenant-1";
    else if (field === "seller_id") fields[field] = "test-seller-1";
    else if (field === "customer_id") fields[field] = "test-customer-1";
    else if (type === "string") fields[field] = `test-${field}`;
    else if (type === "number") fields[field] = 100;
    else if (type === "boolean") fields[field] = true;
    else if (type === "enum") {
      const enumMatch = schemaBody
        .substring(match.index)
        .match(/\.enum\(\[\s*['"]([^'"]+)['"]/);
      if (enumMatch) fields[field] = enumMatch[1];
      else fields[field] = "active";
    } else fields[field] = "mock-data";

    // remove unneeded generic abstract object properties if matched
    if (field === "metadata") delete fields[field];
  }
  return fields;
}

if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir, { recursive: true });

const modules = fs
  .readdirSync(apiDir)
  .filter((f) => fs.statSync(path.join(apiDir, f)).isDirectory());

let generatedCount = 0;
modules.forEach((mod) => {
  const routePath = path.join(apiDir, mod, "route.ts");
  if (!fs.existsSync(routePath)) return;

  const specPath = path.join(testsDir, `${mod}.spec.ts`);
  if (fs.existsSync(specPath)) {
    console.log(`Skipping ${mod}, spec already exists.`);
    return;
  }

  const code = fs.readFileSync(routePath, "utf8");
  // Skip if it doesn't even handle POSTs
  if (!code.includes("export async function POST")) return;

  const payload = parseZodSchema(code);

  if (Object.keys(payload).length === 0) {
    payload["dummy_field"] = "test-value";
  }

  const cleanModName = mod
    .split("-")
    .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
    .join(" ");

  const specCode = `import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  moduleName: "${cleanModName}",
  basePath: "/admin/${mod}",
  entityKey: "item",
  listKey: "items",
  createPayload: ${JSON.stringify(payload, null, 4).replace(/"([^"]+)":/g, "$1:")},
  updatePayload: {
    // Modify one key to test updates
    ...${JSON.stringify(payload, null, 4).replace(/"([^"]+)":/g, "$1:")}
  },
});
`;

  fs.writeFileSync(specPath, specCode);
  generatedCount++;
});

console.log(
  `Successfully generated ${generatedCount} new CRUD E2E specs based on Zod validations.`,
);
