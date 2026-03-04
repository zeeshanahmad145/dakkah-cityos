import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Crowdfunding",
  "basePath": "/admin/crowdfunding",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "Test Campaign 46629043",
    "description": "Test crowdfunding campaign",
    "campaign_type": "donation",
    "goal_amount": 100000,
    "currency_code": "SAR",
    "ends_at": "2026-04-03T17:50:29.043Z"
  },
  "updatePayload": {
    "title": "Updated Campaign"
  }
});
