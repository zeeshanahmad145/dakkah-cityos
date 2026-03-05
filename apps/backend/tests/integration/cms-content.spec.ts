import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "CMS Content",
  "basePath": "/admin/cms-content",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "Page 1772666195974",
    "slug": "pg-1772666195974",
    "content": "Test",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "title": "Updated Page"
  }
});
