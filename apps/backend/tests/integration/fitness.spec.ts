import { generateCrudTests } from "./utils/crud-test-generator";

const TS = Date.now().toString().slice(-8);

generateCrudTests({
  moduleName: "Fitness",
  basePath: "/admin/fitness",
  entityKey: "item",
  listKey: "items",
  createPayload: {
    tenant_id: "test-tenant-1",
    customer_id: "test-customer-1",
    membership_type: "basic",
    start_date: new Date().toISOString(),
    monthly_fee: 200,
    currency_code: "SAR",
  },
  updatePayload: {
    monthly_fee: 250,
    currency_code: "SAR",
  },
});
