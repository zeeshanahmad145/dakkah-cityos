import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Promotion Ext",
  "basePath": "/admin/promotion-ext",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Promo 1772652757882",
    "bundle_type": "fixed",
    "discount_type": "percentage",
    "discount_value": 10,
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Promo"
  }
});
