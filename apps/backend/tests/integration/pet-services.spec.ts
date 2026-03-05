import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Pet Services",
  "basePath": "/admin/pet-services",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Pet 1772666195974",
    "owner_id": "owner-1772666195974",
    "species": "dog",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Pet"
  }
});
