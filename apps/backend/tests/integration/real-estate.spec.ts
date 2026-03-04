import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Real Estate",
  "basePath": "/admin/real-estate",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "Property 1772652757882",
    "property_type": "apartment",
    "listing_type": "sale",
    "price": 500000,
    "currency_code": "SAR",
    "area_sqm": 120,
    "bedrooms": 3,
    "bathrooms": 2,
    "city": "Jeddah",
    "country": "SA",
    "tenant_id": "test-tenant-1",
    "description": "Nice apartment"
  },
  "updatePayload": {
    "title": "Updated Property"
  }
});
