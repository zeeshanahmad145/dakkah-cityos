import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async retrieveLoyaltyAccount(_id: string): Promise<any> {
          return null;
        }
        async updateLoyaltyAccounts(_data: any): Promise<any> {
          return null;
        }
        async createPointTransactions(_data: any): Promise<any> {
          return null;
        }
        async retrieveLoyaltyProgram(_id: string): Promise<any> {
          return null;
        }
        async listPointTransactions(_f: any, _o?: any): Promise<any> {
          return [];
        }
        async listLoyaltyAccounts(_f: any): Promise<any> {
          return [];
        }
        async createLoyaltyAccounts(_data: any): Promise<any> {
          return null;
        }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable,
      text: chainable,
      number: chainable,
      json: chainable,
      enum: () => chainable(),
      boolean: chainable,
      dateTime: chainable,
      bigNumber: chainable,
      float: chainable,
      array: chainable,
      hasOne: () => chainable(),
      hasMany: () => chainable(),
      belongsTo: () => chainable(),
      manyToMany: () => chainable(),
    },
  };
});

import LoyaltyModuleService from "../../../src/modules/loyalty/service";

describe("LoyaltyModuleService", () => {
  let service: LoyaltyModuleService;

  beforeEach(() => {
    service = new LoyaltyModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("earnPoints", () => {
    it("should add points to active account", async () => {
      vi.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc_01",
        status: "active",
        points_balance: 100,
        lifetime_points: 500,
        tenant_id: "t1",
        program_id: "p1",
      });
      vi.spyOn(service, "updateLoyaltyAccounts").mockResolvedValue({});
      jest
        .spyOn(service, "createPointTransactions")
        .mockResolvedValue({ id: "tx_01" });
      vi.spyOn(service, "calculateTier").mockResolvedValue("silver");

      const result = await service.earnPoints({
        accountId: "acc_01",
        points: 50,
      });
      expect(result).toEqual({ id: "tx_01" });
    });

    it("should throw when account is not active", async () => {
      vi.spyOn(service, "retrieveLoyaltyAccount").mockResolvedValue({
        id: "acc_01",
        status: "suspended",
        points_balance: 100,
        lifetime_points: 500,
      });

      await expect(
        service.earnPoints({ accountId: "acc_01", points: 50 }),
      ).rejects.toThrow();
    });
  });
});
