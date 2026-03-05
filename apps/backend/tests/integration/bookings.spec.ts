import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Bookings",
  "basePath": "/admin/bookings",
  "entityKey": "booking",
  "listKey": "bookings",
  "createPayload": {
    "customer_id": "c-1772672118495",
    "service_product_id": "sp-1772672118495",
    "start_time": "2026-04-01T10:00:00Z",
    "end_time": "2026-04-01T11:00:00Z",
    "booking_number": "BK1772672118495"
  },
  "updatePayload": {
    "status": "confirmed"
  }
});
