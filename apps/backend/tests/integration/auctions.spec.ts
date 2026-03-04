import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  moduleName: "Auctions",
  basePath: "/admin/auctions",
  entityKey: "auction",
  listKey: "auctions",
  createPayload: {
    product_id: "test-product-1",
    title: "test-title",
    description: "test-description",
    auction_type: "english",
    starting_price: 100,
    currency_code: "usd",
    bid_increment: 10,
    starts_at: "2026-12-01T00:00:00.000Z",
    ends_at: "2026-12-02T00:00:00.000Z",
    seller_id: "test-seller-1",
  },
  updatePayload: {
    title: "updated-title",
    description: "updated-description",
    currency_code: "usd",
  },
});
