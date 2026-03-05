import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Notification Preferences",
  "basePath": "/admin/notification-preferences",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "customer_id": "c-1772666195974",
    "channel": "email",
    "category": "transactional",
    "event_type": "order.created",
    "enabled": true,
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "enabled": false
  }
});
