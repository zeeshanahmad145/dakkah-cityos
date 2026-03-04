import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "CMS Content",
  "basePath": "/admin/cms-content",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "title": "Test CMS Content",
    "slug": "cms-45524914",
    "type": "page",
    "status": "draft"
  },
  "updatePayload": {
    "title": "Updated CMS Content",
    "status": "published"
  }
});
