import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Notification Preferences",
  "basePath": "/admin/notification-preferences",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "customer_id": "cust-1772652757882",
    "channel": "email",
    "category": "transactional",
    "enabled": true,
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "enabled": false
  }
});
