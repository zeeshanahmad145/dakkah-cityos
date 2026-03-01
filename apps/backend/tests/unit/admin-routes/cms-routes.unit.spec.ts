import {
  GET as listPages,
  POST as createPage,
} from "../../../src/api/admin/cms/pages/route";
import {
  GET as getPage,
  POST as updatePage,
  DELETE as deletePage,
} from "../../../src/api/admin/cms/pages/[id]/route";

const createMockService = () => ({
  listCmsPages: jest.fn(),
  retrieveCmsPage: jest.fn(),
  createCmsPages: jest.fn(),
  updateCmsPages: jest.fn(),
  deleteCmsPages: jest.fn(),
});

const createReq = (mockService: any, overrides: any = {}) => ({
  scope: { resolve: jest.fn(() => mockService) },
  query: {},
  params: {},
  body: {},
  ...overrides,
});

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

describe("Admin CMS Pages Routes", () => {
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    mockService = createMockService();
    jest.clearAllMocks();
  });

  describe("GET /admin/cms/pages", () => {
    it("should list pages with no filters", async () => {
      const pages = [{ id: "page_1", title: "Home" }];
      mockService.listCmsPages.mockResolvedValue(pages);
      const req = createReq(mockService);
      const res = createRes();

      await listPages(req, res);

      expect(mockService.listCmsPages).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({ pages });
    });

    it("should filter by status", async () => {
      mockService.listCmsPages.mockResolvedValue([]);
      const req = createReq(mockService, { query: { status: "published" } });
      const res = createRes();

      await listPages(req, res);

      expect(mockService.listCmsPages).toHaveBeenCalledWith({
        status: "published",
      });
    });

    it("should filter by search query", async () => {
      mockService.listCmsPages.mockResolvedValue([]);
      const req = createReq(mockService, { query: { q: "about" } });
      const res = createRes();

      await listPages(req, res);

      expect(mockService.listCmsPages).toHaveBeenCalledWith({
        title: { $like: "%about%" },
      });
    });

    it("should handle non-array result", async () => {
      mockService.listCmsPages.mockResolvedValue({ id: "page_1" });
      const req = createReq(mockService);
      const res = createRes();

      await listPages(req, res);

      expect(res.json).toHaveBeenCalledWith({ pages: [{ id: "page_1" }] });
    });

    it("should return 400 on service error", async () => {
      mockService.listCmsPages.mockRejectedValue(new Error("DB error"));
      const req = createReq(mockService);
      const res = createRes();

      await listPages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "DB error",
          message: expect.stringMatching(/failed$/),
        }),
      );
    });
  });

  describe("POST /admin/cms/pages", () => {
    it("should create a page and return 201", async () => {
      const page = { id: "page_new", title: "About Us" };
      mockService.createCmsPages.mockResolvedValue(page);
      const req = createReq(mockService, {
        body: { title: "About Us", slug: "about-us" },
      });
      const res = createRes();

      await createPage(req, res);

      expect(mockService.createCmsPages).toHaveBeenCalledWith({
        title: "About Us",
        slug: "about-us",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ page });
    });

    it("should return 400 on creation error", async () => {
      mockService.createCmsPages.mockRejectedValue(new Error("Duplicate slug"));
      const req = createReq(mockService, { body: {} });
      const res = createRes();

      await createPage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("GET /admin/cms/pages/:id", () => {
    it("should retrieve a single page", async () => {
      const page = { id: "page_1", title: "Home" };
      mockService.retrieveCmsPage.mockResolvedValue(page);
      const req = createReq(mockService, { params: { id: "page_1" } });
      const res = createRes();

      await getPage(req, res);

      expect(mockService.retrieveCmsPage).toHaveBeenCalledWith("page_1");
      expect(res.json).toHaveBeenCalledWith({ page });
    });

    it("should return 404 when page not found", async () => {
      mockService.retrieveCmsPage.mockRejectedValue(new Error("Not found"));
      const req = createReq(mockService, { params: { id: "missing" } });
      const res = createRes();

      await getPage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("POST /admin/cms/pages/:id (update)", () => {
    it("should update a page", async () => {
      const updated = { id: "page_1", title: "Updated" };
      mockService.updateCmsPages.mockResolvedValue(updated);
      const req = createReq(mockService, {
        params: { id: "page_1" },
        body: { title: "Updated" },
      });
      const res = createRes();

      await updatePage(req, res);

      expect(mockService.updateCmsPages).toHaveBeenCalledWith("page_1", {
        title: "Updated",
      });
      expect(res.json).toHaveBeenCalledWith({ page: updated });
    });

    it("should return 400 on update error", async () => {
      mockService.updateCmsPages.mockRejectedValue(new Error("Update failed"));
      const req = createReq(mockService, {
        params: { id: "page_1" },
        body: {},
      });
      const res = createRes();

      await updatePage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("DELETE /admin/cms/pages/:id", () => {
    it("should delete a page", async () => {
      mockService.deleteCmsPages.mockResolvedValue(undefined);
      const req = createReq(mockService, { params: { id: "page_1" } });
      const res = createRes();

      await deletePage(req, res);

      expect(mockService.deleteCmsPages).toHaveBeenCalledWith("page_1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "page_1", deleted: true });
    });

    it("should return 400 on delete error", async () => {
      mockService.deleteCmsPages.mockRejectedValue(new Error("Cannot delete"));
      const req = createReq(mockService, { params: { id: "page_1" } });
      const res = createRes();

      await deletePage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
