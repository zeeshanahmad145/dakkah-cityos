import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Invoices",
  "basePath": "/admin/invoices",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "customer_id": "c-1772666195974",
    "amount": 1000,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1",
    "due_date": "2026-04-30"
  },
  "updatePayload": {
    "amount": 900
  }
});
