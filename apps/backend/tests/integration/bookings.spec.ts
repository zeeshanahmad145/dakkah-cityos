import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Bookings",
  "basePath": "/admin/bookings",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "customer_id": "test-customer-1",
    "service_product_id": "svc-1772649864032",
    "start_time": "2026-03-05T18:44:24.032Z",
    "end_time": "2026-03-06T18:44:24.043Z",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "status": "confirmed"
  }
});
