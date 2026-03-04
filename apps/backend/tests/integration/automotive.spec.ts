import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Automotive",
  "basePath": "/admin/automotive",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "seller_id": "test-seller-1",
    "listing_type": "sale",
    "title": "Test Vehicle",
    "make": "Toyota",
    "model_name": "Camry",
    "year": 2023,
    "price": 100000,
    "currency_code": "SAR",
    "fuel_type": "petrol",
    "transmission": "automatic",
    "body_type": "sedan",
    "condition": "new",
    "status": "active"
  },
  "updatePayload": {
    "title": "Updated Vehicle",
    "price": 95000
  }
});
