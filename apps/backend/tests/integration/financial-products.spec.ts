import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Financial Products",
  "basePath": "/admin/financial-products",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "name": "Test Financial Product",
    "loan_type": "personal",
    "min_amount": 5000,
    "max_amount": 100000,
    "currency_code": "SAR",
    "interest_rate_min": 3,
    "interest_rate_max": 10,
    "interest_type": "fixed",
    "min_term_months": 6,
    "max_term_months": 60
  },
  "updatePayload": {
    "name": "Updated Financial Product"
  }
});
