import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Automotive",
  "basePath": "/admin/automotive",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "Car 1772666195974",
    "year": 2024,
    "make": "Toyota",
    "model_name": "Camry",
    "listing_type": "sale",
    "price": 80000,
    "currency_code": "SAR",
    "seller_id": "seller-1772666195974",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "title": "Updated Car"
  }
});
