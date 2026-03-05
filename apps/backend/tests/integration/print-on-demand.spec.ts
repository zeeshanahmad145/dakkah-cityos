import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Print On Demand",
  "basePath": "/admin/print-on-demand",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "title": "POD 1772667436466",
    "product_type": "tshirt",
    "base_cost": 20,
    "retail_price": 50,
    "design_url": "https://cdn.t/1772667436466.png",
    "template_url": "https://tmpl.t/1772667436466.png",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "title": "Updated POD"
  }
});
