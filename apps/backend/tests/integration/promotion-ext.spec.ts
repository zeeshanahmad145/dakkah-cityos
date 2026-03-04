import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Promotion Ext",
  "basePath": "/admin/promotion-ext",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "Promo Ext 1772649864032",
    "tenant_id": "test-tenant-1",
    "bundle_type": "fixed"
  },
  "updatePayload": {
    "title": "Updated Promo Ext"
  }
});
