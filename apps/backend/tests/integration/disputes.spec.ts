import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  moduleName: "Disputes",
  basePath: "/admin/disputes",
  entityKey: "dispute",
  listKey: "disputes",
  createPayload: {
    tenant_id: "test-tenant-1",
    type: "product",
    order_id: "test-order-1",
    customer_id: "test-customer-1",
    status: "open",
    priority: "medium",
  },
  updatePayload: {
    status: "resolved",
    priority: "high",
  },
});
