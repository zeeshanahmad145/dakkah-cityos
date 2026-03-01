import integrationSyncHandler, {
  config,
} from "../../../src/subscribers/integration-sync-subscriber";

describe("integration-sync-subscriber", () => {
  const mockContainer = {};

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
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

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
