import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  moduleName: "Company",
  basePath: "/admin/company",
  entityKey: "item",
  listKey: "items",
  createPayload: {
    name: "test-name",
    legal_name: "test-legal_name",
    registration_number: "test-registration_number",
    type: "test-type",
    industry: "test-industry",
    email: "test@example.com",
    phone: "test-phone",
    tax_id: "test-tax_id",
    customer_id: "test-customer-1",
    store_id: "test-store_id",
    credit_limit: "test-credit_limit",
    payment_terms_days: 100,
    tier: "bronze",
    status: "active"
},
  updatePayload: {
    ...{
    name: "test-name",
    legal_name: "test-legal_name",
    registration_number: "test-registration_number",
    type: "test-type",
    industry: "test-industry",
    email: "test@example.com",
    phone: "test-phone",
    tax_id: "test-tax_id",
    customer_id: "test-customer-1",
    store_id: "test-store_id",
    credit_limit: "test-credit_limit",
    payment_terms_days: 100,
    tier: "bronze",
    status: "active"
}
  },
});
