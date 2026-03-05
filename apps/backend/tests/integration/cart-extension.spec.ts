import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Cart Extension",
  "basePath": "/admin/cart-extension",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "cart_id": "cart-1772666195974",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "cart_id": "cart-updated-1772666195974"
  }
});
