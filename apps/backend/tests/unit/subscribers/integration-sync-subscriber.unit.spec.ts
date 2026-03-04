import { vi } from "vitest";
import integrationSyncHandler, {
  config,
} from "../../../src/subscribers/integration-sync-subscriber";

describe("integration-sync-subscriber", () => {
  const mockContainer = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
};

  describe("config", () => {
    it("has an empty event array", () => {
      expect(config.event).toEqual([]);
    });
  });

  describe("integrationSyncHandler", () => {
    it("is a function that can be called without errors", async () => {
      expect(typeof integrationSyncHandler).toBe("function");
      await expect(
        integrationSyncHandler({ event: {}, container: mockContainer }),
      ).resolves.toBeUndefined();
    });

    it("completes without errors for any event payload", async () => {
      await expect(
        integrationSyncHandler({
          event: { name: "product.created", data: { id: "prod_1" } },
          container: mockContainer,
        }),
      ).resolves.toBeUndefined();
    });

    it("completes without errors for empty payload", async () => {
      await expect(
        integrationSyncHandler({
          event: { name: "governance.policy.changed", data: {} },
          container: mockContainer,
        }),
      ).resolves.toBeUndefined();
    });

    it("completes without side effects", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

      await integrationSyncHandler({
        event: { name: "order.placed", data: { id: "order_1" } },
        container: mockContainer,
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("is a no-op handler for integration sync (all logic moved to Temporal workflows)", async () => {
      // This test documents that the handler is intentionally a no-op
      // All integration sync is now handled via Temporal workflows
      // dispatched by temporal-event-bridge subscriber
      const result = await integrationSyncHandler({
        event: { name: "product.created", data: { id: "prod_1" } },
        container: mockContainer,
      });

      expect(result).toBeUndefined();
    });
  });
});
