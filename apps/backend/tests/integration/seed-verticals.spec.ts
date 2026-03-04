import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  moduleName: "Seed Verticals",
  basePath: "/admin/seed-verticals",
  entityKey: "item",
  listKey: "items",
  createPayload: {
    dummy_field: "test-value"
},
  updatePayload: {
    ...{
    dummy_field: "test-value"
}
  },
});
