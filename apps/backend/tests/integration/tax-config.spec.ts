import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Tax Config",
  "basePath": "/admin/tax-config",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "region_id": "r-1772666195974",
    "tax_rate": 15,
    "tax_type": "vat",
    "name": "Tax 1772666195974",
    "tenant_id": "test-tenant-1",
    "country_code": "SA"
  },
  "updatePayload": {
    "tax_rate": 10
  }
});
