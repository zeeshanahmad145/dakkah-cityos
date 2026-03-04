import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Digital Products",
  "basePath": "/admin/digital-products",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "product_id": "prod-44441689",
    "title": "Test Digital Asset",
    "file_url": "https://example.com/test.pdf",
    "file_name": "test.pdf",
    "file_type": "pdf",
    "file_size": 1024
  },
  "updatePayload": {
    "title": "Updated Digital Asset"
  }
});
