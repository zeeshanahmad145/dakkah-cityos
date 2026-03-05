import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Service Providers",
  "basePath": "/admin/service-providers",
  "entityKey": "provider",
  "listKey": "providers",
  "createPayload": {
    "name": "Provider 1772666195974",
    "service_type": "home",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Provider"
  }
});
