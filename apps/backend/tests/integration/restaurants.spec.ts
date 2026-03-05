import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Restaurants",
  "basePath": "/admin/restaurants",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Rest 1772666195974",
    "handle": "rest-1772666195974",
    "email": "rest1772666195974@test.com",
    "address_line1": "123 Main",
    "city": "Riyadh",
    "postal_code": "12345",
    "country_code": "SA",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Restaurant"
  }
});
