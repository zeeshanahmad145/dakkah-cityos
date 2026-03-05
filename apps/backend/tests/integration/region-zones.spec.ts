import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Region Zones",
  "basePath": "/admin/region-zones",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "medusa_region_id": "mregion-1772666195974",
    "residency_zone": "GCC"
  },
  "updatePayload": {
    "residency_zone": "MENA"
  }
});
