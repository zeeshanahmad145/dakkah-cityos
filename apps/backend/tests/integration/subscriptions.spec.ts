import { generateCrudTests } from "./utils/crud-test-generator";

const TS = Date.now();
generateCrudTests({
  moduleName: "Subscriptions",
  basePath: "/admin/subscriptions",
  entityKey: "subscription",
  listKey: "subscriptions",
  createPayload: {
    customer_id: `cust-${TS}`,
    plan_id: `plan-${TS}`,
    billing_interval: "monthly",
    currency_code: "SAR",
    status: "active",
  },
  updatePayload: { status: "paused" },
});
