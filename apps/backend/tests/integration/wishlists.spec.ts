import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  moduleName: "Wishlists",
  basePath: "/admin/wishlists",
  entityKey: "wishlist",
  listKey: "wishlists",
  createPayload: {
    customer_id: "test-customer-1",
    tenant_id: "test-tenant-1",
    title: "My Test Wishlist",
    visibility: "private",
  },
  updatePayload: {
    title: "Updated Wishlist",
    visibility: "shared",
  },
});
