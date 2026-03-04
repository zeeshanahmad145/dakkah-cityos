import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Real Estate",
  "basePath": "/admin/real-estate",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "Property 1772649864032",
    "tenant_id": "test-tenant-1",
    "property_type": "apartment",
    "price": 500000,
    "currency_code": "SAR",
    "area_sqm": 120,
    "bedrooms": 3,
    "bathrooms": 2,
    "city": "Jeddah",
    "state": "Makkah",
    "country": "SA",
    "postal_code": "23456",
    "year_built": 2020,
    "virtual_tour_url": "https://example.com/tour"
  },
  "updatePayload": {
    "title": "Updated Property"
  }
});
