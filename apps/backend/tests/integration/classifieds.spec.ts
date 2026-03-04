import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Classifieds",
  "basePath": "/admin/classifieds",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "seller_id": "test-seller-1",
    "title": "Test Listing",
    "description": "Test description",
    "currency_code": "SAR",
    "listing_type": "sell",
    "price": 5000,
    "status": "active"
  },
  "updatePayload": {
    "title": "Updated Listing",
    "price": 4500
  }
});
