import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Shipping Extension",
  "basePath": "/admin/shipping-extension",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Shipping Rate 1772649864032",
    "tenant_id": "test-tenant-1",
    "carrier_id": "carrier-1",
    "min_amount": 0,
    "max_amount": 1000,
    "rate": 25,
    "currency_code": "SAR"
  },
  "updatePayload": {
    "name": "Updated Rate"
  }
});
