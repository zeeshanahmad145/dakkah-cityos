import { vi } from "vitest";
import {
  GET as listPrograms,
  POST as createProgram,
} from "../../../src/api/admin/loyalty/programs/route";
import {
  GET as getProgram,
  POST as updateProgram,
  DELETE as deleteProgram,
} from "../../../src/api/admin/loyalty/programs/[id]/route";

const createMockService = () => ({
  listLoyaltyPrograms: vi.fn(),
  retrieveLoyaltyProgram: vi.fn(),
  createLoyaltyPrograms: vi.fn(),
  updateLoyaltyPrograms: vi.fn(),
  deleteLoyaltyPrograms: vi.fn(),
});

const createReq = (mockService: any, overrides: any = {}) => ({
  scope: { resolve: vi.fn(() => mockService) },
  query: {},
  params: {},
  body: {},
  ...overrides,
});

const createRes = () => {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  return res;
};

describe("Admin Loyalty Programs Routes", () => {
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    mockService = createMockService();
    vi.clearAllMocks();
  });

  describe("GET /admin/loyalty/programs", () => {
    it("should list programs", async () => {
      const programs = [{ id: "prog_1", name: "Gold" }];
      mockService.listLoyaltyPrograms.mockResolvedValue(programs);
      const req = createReq(mockService);
      const res = createRes();

      await listPrograms(req, res);

      expect(mockService.listLoyaltyPrograms).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({ programs });
    });

    it("should handle non-array result", async () => {
      mockService.listLoyaltyPrograms.mockResolvedValue({ id: "prog_1" });
      const req = createReq(mockService);
      const res = createRes();

      await listPrograms(req, res);

      expect(res.json).toHaveBeenCalledWith({ programs: [{ id: "prog_1" }] });
    });

    it("should handle null result", async () => {
      mockService.listLoyaltyPrograms.mockResolvedValue(null);
      const req = createReq(mockService);
      const res = createRes();

      await listPrograms(req, res);

      expect(res.json).toHaveBeenCalledWith({ programs: [] });
    });

    it("should return 400 on error", async () => {
      mockService.listLoyaltyPrograms.mockRejectedValue(
        new Error("Service down"),
      );
      const req = createReq(mockService);
      const res = createRes();

      await listPrograms(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Service down",
          message: expect.stringMatching(/failed$/),
        }),
      );
    });
  });

  describe("POST /admin/loyalty/programs", () => {
    it("should create a program and return 201", async () => {
      const program = { id: "prog_new", name: "Silver" };
      mockService.createLoyaltyPrograms.mockResolvedValue(program);
      const req = createReq(mockService, {
        body: { name: "Silver", points_per_dollar: 10 },
      });
      const res = createRes();

      await createProgram(req, res);

      expect(mockService.createLoyaltyPrograms).toHaveBeenCalledWith({
        name: "Silver",
        points_per_dollar: 10,
        tenant_id: "default",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ program });
    });

    it("should return 400 on creation error", async () => {
      mockService.createLoyaltyPrograms.mockRejectedValue(
        new Error("Name required"),
      );
      const req = createReq(mockService, { body: {} });
      const res = createRes();

      await createProgram(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("GET /admin/loyalty/programs/:id", () => {
    it("should retrieve a single program", async () => {
      const program = { id: "prog_1", name: "Gold" };
      mockService.retrieveLoyaltyProgram.mockResolvedValue(program);
      const req = createReq(mockService, { params: { id: "prog_1" } });
      const res = createRes();

      await getProgram(req, res);

      expect(mockService.retrieveLoyaltyProgram).toHaveBeenCalledWith("prog_1");
      expect(res.json).toHaveBeenCalledWith({ program });
    });

    it("should return 404 when program not found", async () => {
      mockService.retrieveLoyaltyProgram.mockRejectedValue(
        new Error("Not found"),
      );
      const req = createReq(mockService, { params: { id: "missing" } });
      const res = createRes();

      await getProgram(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("POST /admin/loyalty/programs/:id (update)", () => {
    it("should update a program", async () => {
      const updated = { id: "prog_1", name: "Platinum" };
      mockService.updateLoyaltyPrograms.mockResolvedValue(updated);
      const req = createReq(mockService, {
        params: { id: "prog_1" },
        body: { name: "Platinum" },
      });
      const res = createRes();

      await updateProgram(req, res);

      expect(mockService.updateLoyaltyPrograms).toHaveBeenCalledWith("prog_1", {
        name: "Platinum",
      });
      expect(res.json).toHaveBeenCalledWith({ program: updated });
    });

    it("should return 400 on update error", async () => {
      mockService.updateLoyaltyPrograms.mockRejectedValue(new Error("Invalid"));
      const req = createReq(mockService, {
        params: { id: "prog_1" },
        body: {},
      });
      const res = createRes();

      await updateProgram(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("DELETE /admin/loyalty/programs/:id", () => {
    it("should delete a program", async () => {
      mockService.deleteLoyaltyPrograms.mockResolvedValue(undefined);
      const req = createReq(mockService, { params: { id: "prog_1" } });
      const res = createRes();

      await deleteProgram(req, res);

      expect(mockService.deleteLoyaltyPrograms).toHaveBeenCalledWith("prog_1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "prog_1", deleted: true });
    });

    it("should return 400 on delete error", async () => {
      mockService.deleteLoyaltyPrograms.mockRejectedValue(new Error("In use"));
      const req = createReq(mockService, { params: { id: "prog_1" } });
      const res = createRes();

      await deleteProgram(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
