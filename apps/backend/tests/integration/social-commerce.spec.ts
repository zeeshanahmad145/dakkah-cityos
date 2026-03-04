import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Social Commerce",
  "basePath": "/admin/social-commerce",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "host_id": "test-host-1",
    "title": "Test Group Buy"
  },
  "updatePayload": {
    "title": "Updated Group Buy"
  }
});
