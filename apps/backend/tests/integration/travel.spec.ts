import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Travel",
  "basePath": "/admin/travel",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "name": "Test Hotel",
    "property_type": "hotel",
    "address_line1": "Test Street",
    "city": "Dubai",
    "country_code": "AE"
  },
  "updatePayload": {
    "name": "Updated Hotel"
  }
});
