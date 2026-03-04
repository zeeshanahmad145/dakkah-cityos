import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Education",
  "basePath": "/admin/education",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "title": "Test Course",
    "category": "technology",
    "level": "beginner",
    "format": "self_paced",
    "price": 2000,
    "currency_code": "SAR",
    "status": "draft"
  },
  "updatePayload": {
    "title": "Updated Course",
    "status": "published"
  }
});
