import { generateCrudTests } from "./utils/crud-test-generator";

const TS = Date.now().toString().slice(-8);

generateCrudTests({
  moduleName: "Governance",
  basePath: "/admin/governance",
  entityKey: "item",
  listKey: "items",
  createPayload: {
    name: `Test Governance Authority ${TS}`,
    slug: `gov-${TS}`,
    type: "authority",
  },
  updatePayload: {
    name: "Updated Governance Authority",
  },
});
