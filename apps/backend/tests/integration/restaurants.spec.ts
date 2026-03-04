import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Restaurants",
  "basePath": "/admin/restaurants",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Test Restaurant",
    "address_line1": "Test Street 1",
    "city": "Riyadh",
    "postal_code": "11564",
    "country_code": "SA",
    "tenant_id": "test-tenant-1",
    "handle": "rest-45524914"
  },
  "updatePayload": {
    "name": "Updated Restaurant"
  }
});
