import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "White Label",
  "basePath": "/admin/white-label",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "WL 1772666195974",
    "brand_name": "Brand 1772666195974",
    "base_cost": 10,
    "retail_price": 50,
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "brand_name": "Updated Brand"
  }
});
