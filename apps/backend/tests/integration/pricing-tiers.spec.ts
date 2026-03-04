import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Pricing Tiers",
  "basePath": "/admin/pricing-tiers",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Bronze Tier 45524914",
    "discount_percentage": 5
  },
  "updatePayload": {
    "name": "Updated Tier",
    "discount_percentage": 7
  }
});
