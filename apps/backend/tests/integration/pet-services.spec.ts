import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Pet Services",
  "basePath": "/admin/pet-services",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Pet Service 1772649864032",
    "tenant_id": "test-tenant-1",
    "service_type": "grooming",
    "price": 50,
    "currency_code": "SAR"
  },
  "updatePayload": {
    "name": "Updated Pet Service"
  }
});
