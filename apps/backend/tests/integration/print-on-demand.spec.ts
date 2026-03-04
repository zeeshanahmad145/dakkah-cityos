import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Print On Demand",
  "basePath": "/admin/print-on-demand",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "POD Product 1772649864032",
    "tenant_id": "test-tenant-1",
    "product_type": "t-shirt",
    "base_price": 30,
    "currency_code": "SAR"
  },
  "updatePayload": {
    "name": "Updated POD"
  }
});
