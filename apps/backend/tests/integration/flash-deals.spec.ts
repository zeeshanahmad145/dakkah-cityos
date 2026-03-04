import { generateCrudTests } from "./utils/crud-test-generator";

const TS = Date.now();
generateCrudTests({
  moduleName: "Flash Deals",
  basePath: "/admin/flash-deals",
  entityKey: "item",
  listKey: "items",
  createPayload: {
    tenant_id: "test-tenant-1",
    code: `FLASH-${TS}`,
    initial_value: 100,
    remaining_value: 100,
    currency_code: "SAR",
    is_active: true,
  },
  updatePayload: { is_active: false },
});
