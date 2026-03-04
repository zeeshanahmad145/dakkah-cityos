import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Volume Pricing",
  "basePath": "/admin/volume-pricing",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Vol Price 45524914",
    "applies_to": "product",
    "pricing_type": "tiered",
    "tiers": [
      {
        "min_quantity": 1,
        "price": 1000
      }
    ]
  },
  "updatePayload": {
    "name": "Updated Volume Pricing"
  }
});
