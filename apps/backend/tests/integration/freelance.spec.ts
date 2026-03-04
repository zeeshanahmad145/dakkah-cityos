import { generateCrudTests } from "./utils/crud-test-generator";

const TS = Date.now().toString().slice(-8);

generateCrudTests({
  moduleName: "Freelance",
  basePath: "/admin/freelance",
  entityKey: "item",
  listKey: "items",
  createPayload: {
    tenant_id: "test-tenant-1",
    freelancer_id: `fl-${TS}`,
    title: "Test Gig Listing",
    description: "A test gig for development",
    listing_type: "fixed_price",
    currency_code: "SAR",
  },
  updatePayload: {
    title: "Updated Gig Listing",
    description: "Updated gig description",
  },
});
