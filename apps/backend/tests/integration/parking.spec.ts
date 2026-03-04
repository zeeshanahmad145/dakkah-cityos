import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Parking",
  "basePath": "/admin/parking",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Parking 1772654359049",
    "total_spots": 50,
    "zone": "A",
    "tenant_id": "test-tenant-1",
    "city": "Jeddah",
    "price_per_hour": 10,
    "currency_code": "SAR"
  },
  "updatePayload": {
    "name": "Updated Parking"
  }
});
