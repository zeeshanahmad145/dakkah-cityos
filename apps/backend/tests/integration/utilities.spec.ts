import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Utilities",
  "basePath": "/admin/utilities",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "customer_id": "test-customer-1",
    "utility_type": "electricity",
    "provider_name": "SEWA",
    "account_number": "ACC-45524914",
    "status": "active"
  },
  "updatePayload": {
    "provider_name": "DEWA"
  }
});
