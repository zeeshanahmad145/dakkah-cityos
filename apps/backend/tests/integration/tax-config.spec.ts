import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Tax Config",
  "basePath": "/admin/tax-config",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "region_id": "region-1772654359049",
    "tax_rate": 15,
    "tax_type": "vat",
    "name": "Tax 1772654359049",
    "tenant_id": "test-tenant-1",
    "country_code": "SA"
  },
  "updatePayload": {
    "tax_rate": 10
  }
});
