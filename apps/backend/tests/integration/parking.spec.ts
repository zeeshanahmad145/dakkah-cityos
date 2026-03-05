import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Parking",
  "basePath": "/admin/parking",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "name": "Lot 1772668663845",
    "zone_type": "lot",
    "total_spots": 50,
    "available_spots": 40,
    "currency_code": "SAR"
  },
  "updatePayload": {
    "name": "Updated Lot"
  }
});
