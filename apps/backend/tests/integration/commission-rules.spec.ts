import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Commission Rules",
  "basePath": "/admin/commission-rules",
  "entityKey": "commission_rule",
  "listKey": "commission_rules",
  "createPayload": {
    "name": "Commission Rule 1772649864032",
    "type": "percentage",
    "value": 10,
    "is_active": true,
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Rule",
    "type": "percentage",
    "value": 15
  }
});
