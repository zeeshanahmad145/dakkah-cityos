import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Crowdfunding",
  "basePath": "/admin/crowdfunding",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "Campaign 1772666195974",
    "description": "Fund us",
    "goal_amount": 10000,
    "currency_code": "SAR",
    "campaign_type": "equity",
    "ends_at": "2026-06-01T00:00:00Z"
  },
  "updatePayload": {
    "title": "Updated Campaign"
  }
});
