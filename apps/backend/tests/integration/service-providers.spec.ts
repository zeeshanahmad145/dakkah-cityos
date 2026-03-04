import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Service Providers",
  "basePath": "/admin/service-providers",
  "entityKey": "provider",
  "listKey": "providers",
  "createPayload": {
    "name": "Test Service Provider",
    "email": "provider-44441689@example.com",
    "is_active": true
  },
  "updatePayload": {
    "name": "Updated Service Provider"
  }
});
