import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Notification Preferences",
  "basePath": "/admin/notification-preferences",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "customer_id": "cust-1772649864032",
    "channel": "email",
    "category": "transactional",
    "enabled": true
  },
  "updatePayload": {
    "enabled": false
  }
});
