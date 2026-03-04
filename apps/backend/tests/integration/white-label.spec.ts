import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "White Label",
  "basePath": "/admin/white-label",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "Test White Label",
    "brand_name": "TestBrand",
    "base_cost": 50,
    "retail_price": 120,
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "title": "Updated White Label"
  }
});
