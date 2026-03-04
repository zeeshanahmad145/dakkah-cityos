import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Rentals",
  "basePath": "/admin/rentals",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "product_id": "prod-45524914",
    "rental_type": "daily",
    "base_price": 500,
    "currency_code": "SAR"
  },
  "updatePayload": {
    "base_price": 450
  }
});
