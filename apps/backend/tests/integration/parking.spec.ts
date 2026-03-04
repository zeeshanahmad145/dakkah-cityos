import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Parking",
  "basePath": "/admin/parking",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Parking 1772649864032",
    "tenant_id": "test-tenant-1",
    "total_spots": 50,
    "zone": "A"
  },
  "updatePayload": {
    "name": "Updated Parking"
  }
});
