import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Print On Demand",
  "basePath": "/admin/print-on-demand",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "POD 1772652757882",
    "product_type": "t-shirt",
    "base_price": 30,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "title": "Updated POD"
  }
});
