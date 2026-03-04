import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "I18n",
  "basePath": "/admin/i18n",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "locale": "en-44441689",
    "key": "test.key",
    "value": "Test Value"
  },
  "updatePayload": {
    "value": "Updated Value"
  }
});
