import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Cart Extension",
  "basePath": "/admin/cart-extension",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "cart_id": "cart-45524914"
  },
  "updatePayload": {
    "gift_wrap": true,
    "gift_message": "Happy Birthday!"
  }
});
