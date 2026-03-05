import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Volume Pricing",
  "basePath": "/admin/volume-pricing",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Vol 1772672118495",
    "applies_to": "product",
    "pricing_type": "tiered",
    "min_quantity": 5
  },
  "updatePayload": {
    "name": "Updated Vol"
  }
});
