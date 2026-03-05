import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Shipping Extension",
  "basePath": "/admin/shipping-extension",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Ship 1772672118495",
    "carrier_name": "Aramex",
    "carrier_id": "carrier-1772672118495",
    "service_type": "standard",
    "min_amount": 0,
    "max_amount": 1000,
    "base_rate": 25,
    "rate": 25,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Shipping"
  }
});
