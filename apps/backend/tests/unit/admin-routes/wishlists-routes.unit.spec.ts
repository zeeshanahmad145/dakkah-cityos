import {
  GET as listWishlists,
  POST as createWishlist,
} from "../../../src/api/admin/wishlists/route";
import {
  GET as getWishlist,
  POST as updateWishlist,
  DELETE as deleteWishlist,
} from "../../../src/api/admin/wishlists/[id]/route";

const createMockService = () => ({
  listAndCountWishlists: jest.fn(),
  retrieveWishlist: jest.fn(),
  createWishlists: jest.fn(),
  updateWishlists: jest.fn(),
  deleteWishlists: jest.fn(),
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

describe("Admin Wishlists Routes", () => {
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    mockService = createMockService();
    jest.clearAllMocks();
  });

  describe("GET /admin/wishlists", () => {
    it("should list wishlists with default pagination", async () => {
      const items = [{ id: "wl_1" }, { id: "wl_2" }];
      mockService.listAndCountWishlists.mockResolvedValue([items, 2]);
      const req = createReq(mockService);
      const res = createRes();

      await listWishlists(req, res);

      expect(mockService.listAndCountWishlists).toHaveBeenCalledWith(
        {},
        { take: 20, skip: 0 },
      );
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 2,
        limit: 20,
        offset: 0,
      });
    });

    it("should parse custom limit and offset", async () => {
      mockService.listAndCountWishlists.mockResolvedValue([[], 0]);
      const req = createReq(mockService, {
        query: { limit: "5", offset: "10" },
      });
      const res = createRes();

      await listWishlists(req, res);

      expect(mockService.listAndCountWishlists).toHaveBeenCalledWith(
        {},
        { take: 5, skip: 10 },
      );
      expect(res.json).toHaveBeenCalledWith({
        items: [],
        count: 0,
        limit: 5,
        offset: 10,
      });
    });

    it("should return 400 on error", async () => {
      mockService.listAndCountWishlists.mockRejectedValue(
        new Error("DB error"),
      );
      const req = createReq(mockService);
      const res = createRes();

      await listWishlists(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "DB error",
          message: expect.stringMatching(/failed$/),
        }),
      );
    });
  });

  describe("POST /admin/wishlists", () => {
    it("should create a wishlist and return 201", async () => {
      const item = { id: "wl_new", customer_id: "cust_1" };
      mockService.createWishlists.mockResolvedValue(item);
      const req = createReq(mockService, {
        body: { customer_id: "cust_1", product_id: "prod_1" },
      });
      const res = createRes();

      await createWishlist(req, res);

      expect(mockService.createWishlists).toHaveBeenCalledWith({
        customer_id: "cust_1",
        product_id: "prod_1",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("should return 400 on creation error", async () => {
      mockService.createWishlists.mockRejectedValue(new Error("Invalid"));
      const req = createReq(mockService, { body: {} });
      const res = createRes();

      await createWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("GET /admin/wishlists/:id", () => {
    it("should retrieve a single wishlist", async () => {
      const item = { id: "wl_1", customer_id: "cust_1" };
      mockService.retrieveWishlist.mockResolvedValue(item);
      const req = createReq(mockService, { params: { id: "wl_1" } });
      const res = createRes();

      await getWishlist(req, res);

      expect(mockService.retrieveWishlist).toHaveBeenCalledWith("wl_1");
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("should return 404 when not found", async () => {
      mockService.retrieveWishlist.mockRejectedValue(new Error("Not found"));
      const req = createReq(mockService, { params: { id: "missing" } });
      const res = createRes();

      await getWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("POST /admin/wishlists/:id (update)", () => {
    it("should update a wishlist", async () => {
      const updated = { id: "wl_1", name: "Favorites" };
      mockService.updateWishlists.mockResolvedValue(updated);
      const req = createReq(mockService, {
        params: { id: "wl_1" },
        body: { name: "Favorites" },
      });
      const res = createRes();

      await updateWishlist(req, res);

      expect(mockService.updateWishlists).toHaveBeenCalledWith("wl_1", {
        name: "Favorites",
      });
      expect(res.json).toHaveBeenCalledWith({ item: updated });
    });

    it("should return 400 on update error", async () => {
      mockService.updateWishlists.mockRejectedValue(new Error("Error"));
      const req = createReq(mockService, { params: { id: "wl_1" }, body: {} });
      const res = createRes();

      await updateWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("DELETE /admin/wishlists/:id", () => {
    it("should delete a wishlist", async () => {
      mockService.deleteWishlists.mockResolvedValue(undefined);
      const req = createReq(mockService, { params: { id: "wl_1" } });
      const res = createRes();

      await deleteWishlist(req, res);

      expect(mockService.deleteWishlists).toHaveBeenCalledWith("wl_1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "wl_1", deleted: true });
    });

    it("should return 400 on delete error", async () => {
      mockService.deleteWishlists.mockRejectedValue(new Error("Error"));
      const req = createReq(mockService, { params: { id: "wl_1" } });
      const res = createRes();

      await deleteWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
