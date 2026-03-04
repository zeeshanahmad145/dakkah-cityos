import { generateCrudTests } from "./utils/crud-test-generator";

const TS = Date.now();
generateCrudTests({
  moduleName: "Flash Sales",
  basePath: "/admin/flash-sales",
  entityKey: "item",
  listKey: "items",
  createPayload: {
    tenant_id: "test-tenant-1",
    code: `SALE-${TS}`,
    initial_value: 200,
    remaining_value: 200,
    currency_code: "SAR",
    is_active: true,
  },
  updatePayload: { is_active: false },
});
