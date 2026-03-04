import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Vendors",
  "basePath": "/admin/vendors",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "handle": "vendor-45138994",
    "businessName": "Test Vendor Business",
    "legalName": "Test Vendor Legal Name",
    "email": "vendor-45138994@example.com",
    "address": {
      "line1": "Test Street 1",
      "city": "Riyadh",
      "postalCode": "11564",
      "countryCode": "SA"
    }
  },
  "updatePayload": {
    "businessName": "Updated Vendor Business"
  }
});
