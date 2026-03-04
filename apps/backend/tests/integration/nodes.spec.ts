import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  moduleName: "Nodes",
  basePath: "/admin/nodes",
  entityKey: "item",
  listKey: "items",
  createPayload: {
    name: "test-name",
    slug: "test-slug",
    code: "test-code",
    type: "CITY",
    tenant_id: "test-tenant-1",
    location: {},
    status: "active",
  },
  updatePayload: {
    ...{
      name: "test-name",
      slug: "test-slug",
      code: "test-code",
      type: "CITY",
      tenant_id: "test-tenant-1",
      location: {},
      status: "active",
    },
  },
});
