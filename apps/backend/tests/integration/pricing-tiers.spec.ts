import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Pricing Tiers",
  "basePath": "/admin/pricing-tiers",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Tier 1772666195974",
    "discount_percentage": 10
  },
  "updatePayload": {
    "name": "Updated Tier"
  }
});
