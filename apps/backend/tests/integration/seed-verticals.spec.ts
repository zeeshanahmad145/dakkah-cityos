import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Seed Verticals",
  "basePath": "/admin/seed-verticals",
  "entityKey": "success",
  "listKey": "items",
  "createPayload": {
    "vertical": "retail",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "vertical": "grocery"
  }
});
