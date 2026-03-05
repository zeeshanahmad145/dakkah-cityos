import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Freelance",
  "basePath": "/admin/freelance",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "freelancer_id": "fl-1772668663845",
    "title": "Gig 1772668663845",
    "description": "Expert developer",
    "listing_type": "fixed_price",
    "currency_code": "SAR"
  },
  "updatePayload": {
    "title": "Updated Gig"
  }
});
