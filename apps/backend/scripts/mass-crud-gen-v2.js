const fs = require("fs");
const path = require("path");

const apiDir = path.join(__dirname, "../src/api/admin");
const testsDir = path.join(__dirname, "../tests/integration");

function parseZodSchemaRobust(code) {
  const fields = {};

  // Find the content inside the FIRST .object({ ... })
  const objectStart = code.indexOf(".object({");
  if (objectStart === -1) return fields;

  let braceCount = 0;
  let objectEnd = -1;
  for (let i = objectStart + 8; i < code.length; i++) {
    if (code[i] === "{") braceCount++;
    if (code[i] === "}") {
      braceCount--;
      if (braceCount === 0) {
        objectEnd = i;
        break;
      }
    }
  }

  if (objectEnd === -1) return fields;
  const schemaBody = code.substring(objectStart + 10, objectEnd);

  // Handle multiline formatting like `z \n .enum` by accounting for whitespace/newlines
  const regex = /([a-zA-Z0-9_]+)\s*:\s*z[\s\n]*\.[\s\n]*([a-zA-Z]+)/g;
  let match;
  while ((match = regex.exec(schemaBody)) !== null) {
    const field = match[1];
    const type = match[2];

    if (field === "tenant_id") fields[field] = "test-tenant-1";
    else if (field === "seller_id") fields[field] = "test-seller-1";
    else if (field === "customer_id") fields[field] = "test-customer-1";
    else if (field === "email") fields[field] = "test@example.com";
    else if (field === "tiers")
      fields[field] = [{ min_quantity: 1, discount_percentage: 10 }]; // volume-pricing specific
    else if (type === "number")
      fields[field] = 100; // Evaluated first to prevent Date interference on numeric fields like delivery_time_days
    else if (type === "boolean") fields[field] = true;
    else if (type === "array") fields[field] = ["test-value"];
    else if (
      field.endsWith("_at") ||
      field.includes("date_") ||
      field === "time"
    ) {
      fields[field] = new Date().toISOString();
    } else if (type === "string") fields[field] = `test-${field}`;
    else if (type === "enum") {
      const afterEnum = schemaBody.substring(match.index);
      const enumMatch = afterEnum.match(/\.enum\(\[\s*['"]([^'"]+)['"]/);
      if (enumMatch) fields[field] = enumMatch[1];
      else fields[field] = "active"; // fallback
    } else if (type === "record" || type === "any" || type === "unknown") {
      fields[field] = {};
    } else fields[field] = "mock-data";

    if (field === "metadata") delete fields[field];
  }
  return fields;
}

const modules = fs
  .readdirSync(apiDir)
  .filter((f) => fs.statSync(path.join(apiDir, f)).isDirectory());

let generatedCount = 0;
modules.forEach((mod) => {
  const routePath = path.join(apiDir, mod, "route.ts");
  if (!fs.existsSync(routePath)) return;

  const specPath = path.join(testsDir, `${mod}.spec.ts`);
  const code = fs.readFileSync(routePath, "utf8");
  if (!code.includes("export async function POST")) return;

  const payload = parseZodSchemaRobust(code);

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
    ...${JSON.stringify(payload, null, 4).replace(/"([^"]+)":/g, "$1:")}
  },
});
`;

  fs.writeFileSync(specPath, specCode);
  generatedCount++;
});

console.log(
  `Successfully hard-patched ${generatedCount} E2E specs supporting native Zod arrays, numeric priority logic, and nested enum literals.`,
);
