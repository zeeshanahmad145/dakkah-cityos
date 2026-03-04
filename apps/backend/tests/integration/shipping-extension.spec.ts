import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Shipping Extension",
  "basePath": "/admin/shipping-extension",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Ship 1772652757882",
    "carrier_name": "Aramex",
    "min_amount": 0,
    "max_amount": 1000,
    "rate": 25,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Shipping"
  }
});
