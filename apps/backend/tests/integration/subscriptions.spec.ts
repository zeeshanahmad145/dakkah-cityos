import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Subscriptions",
  "basePath": "/admin/subscriptions",
  "entityKey": "subscription",
  "listKey": "subscriptions",
  "createPayload": {
    "customer_id": "c-1772672118495",
    "plan_id": "plan-1772672118495",
    "billing_interval": "monthly"
  },
  "updatePayload": {
    "status": "paused"
  }
});
