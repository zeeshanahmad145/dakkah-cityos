import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Region Zones",
  "basePath": "/admin/region-zones",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "residency_zone": "GCC",
    "medusa_region_id": "region-45138994"
  },
  "updatePayload": {
    "name": "Updated Region Zone"
  }
});
