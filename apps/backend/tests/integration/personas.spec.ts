import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Personas",
  "basePath": "/admin/personas",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Persona 1772668663845",
    "slug": "p-1772668663845",
    "category": "consumer",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Persona"
  }
});
