import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Advertising",
  "basePath": "/admin/advertising",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "advertiser_id": "test-advertiser-1",
    "name": "Test Ad Campaign",
    "campaign_type": "sponsored_listing",
    "budget": 10000,
    "currency_code": "SAR"
  },
  "updatePayload": {
    "name": "Updated Ad Campaign",
    "status": "paused"
  }
});
