import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Subscriptions",
  "basePath": "/admin/subscriptions",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Sub 1772652757882",
    "description": "Monthly subscription",
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1",
    "billing_interval": "monthly",
    "price": 99
  },
  "updatePayload": {
    "name": "Updated Subscription"
  }
});
