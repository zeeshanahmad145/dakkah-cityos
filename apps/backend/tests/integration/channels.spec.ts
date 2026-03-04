import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Channels",
  "basePath": "/admin/channels",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "channel_type": "web",
    "name": "Test Channel"
  },
  "updatePayload": {
    "name": "Updated Channel"
  }
});
