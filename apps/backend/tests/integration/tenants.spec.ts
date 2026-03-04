import { generateCrudTests } from "./utils/crud-test-generator";

// Use timestamp to ensure unique slug/handle across test runs (shared DB)
const TS = Date.now().toString().slice(-8);

generateCrudTests({
  moduleName: "Tenants",
  basePath: "/admin/tenants",
  entityKey: "tenant",
  listKey: "tenants",
  createPayload: {
    name: "Test Tenant",
    slug: `test-slug-${TS}`,
    handle: `test-handle-${TS}`,
    domain: "test.example.com",
    status: "trial",
  },
  updatePayload: {
    name: "Updated Tenant",
    domain: "updated.example.com",
  },
});
