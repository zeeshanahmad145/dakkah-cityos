import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Tax Config",
  "basePath": "/admin/tax-config",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "region_id": "region-1772649864032",
    "tax_rate": 15,
    "tax_type": "vat"
  },
  "updatePayload": {
    "tax_rate": 10
  }
});
