import { generateCrudTests } from "./utils/crud-test-generator";

const TS = Date.now().toString().slice(-8);

generateCrudTests({
  moduleName: "Invoices",
  basePath: "/admin/invoices",
  entityKey: "invoice",
  listKey: "invoices",
  createPayload: {
    company_id: `company-${TS}`,
    customer_id: "test-customer-1",
    issue_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
    currency_code: "SAR",
    items: [{ title: "Service Fee", quantity: 1, unit_price: 5000 }],
  },
  updatePayload: {
    notes: "Updated invoice notes",
    status: "sent",
  },
});
