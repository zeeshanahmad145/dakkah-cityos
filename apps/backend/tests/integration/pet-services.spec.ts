import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Pet Services",
  "basePath": "/admin/pet-services",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "PetSvc 1772652757882",
    "service_type": "grooming",
    "price": 50,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1",
    "duration_minutes": 60
  },
  "updatePayload": {
    "name": "Updated Pet Service"
  }
});
