import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listTranslations(_filter: any): Promise<any> {
          return [];
        }
        async retrieveTranslation(_id: string): Promise<any> {
          return null;
        }
        async createTranslations(_data: any): Promise<any> {
          return {};
        }
        async updateTranslations(_data: any): Promise<any> {
          return {};
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

import I18nModuleService from "../../../src/modules/i18n/service";

describe("I18nModuleService", () => {
  let service: I18nModuleService;

  beforeEach(() => {
    service = new I18nModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getTranslations", () => {
    it("returns published translations for tenant and locale", async () => {
      const translations = [{ id: "t1", key: "hello", value: "مرحبا" }];
      vi.spyOn(service, "listTranslations").mockResolvedValue(translations);

      const result = await service.getTranslations("t1", "ar");
      expect(result).toEqual(translations);
    });

    it("filters by namespace when provided", async () => {
      const listSpy = jest
        .spyOn(service, "listTranslations")
        .mockResolvedValue([]);

      await service.getTranslations("t1", "ar", "checkout");
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: "checkout" }),
      );
    });
  });

  describe("getTranslation", () => {
    it("returns first matching translation", async () => {
      const translation = { id: "t1", key: "hello", value: "Hello" };
      vi.spyOn(service, "listTranslations").mockResolvedValue([translation]);

      const result = await service.getTranslation("t1", "en", "hello");
      expect(result).toEqual(translation);
    });

    it("returns null when not found", async () => {
      vi.spyOn(service, "listTranslations").mockResolvedValue([]);

      const result = await service.getTranslation("t1", "en", "missing");
      expect(result).toBeNull();
    });
  });

  describe("upsertTranslation", () => {
    it("updates existing translation", async () => {
      jest
        .spyOn(service, "listTranslations")
        .mockResolvedValue([{ id: "t1", key: "hello" }]);
      const updateSpy = jest
        .spyOn(service, "updateTranslations")
        .mockResolvedValue({ id: "t1", value: "Hi" });

      await service.upsertTranslation("t1", "en", "hello", "Hi");
      expect(updateSpy).toHaveBeenCalledWith({
        id: "t1",
        value: "Hi",
        status: "published",
      });
    });

    it("creates new translation when not existing", async () => {
      vi.spyOn(service, "listTranslations").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createTranslations")
        .mockResolvedValue({ id: "t2" });

      await service.upsertTranslation("t1", "en", "goodbye", "Bye");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: "t1",
          locale: "en",
          key: "goodbye",
          value: "Bye",
          namespace: "common",
        }),
      );
    });
  });

  describe("bulkUpsert", () => {
    it("processes multiple translations", async () => {
      vi.spyOn(service, "listTranslations").mockResolvedValue([]);
      jest
        .spyOn(service, "createTranslations")
        .mockResolvedValue({ id: "new" });

      const result = await service.bulkUpsert("t1", "en", [
        { key: "hello", value: "Hello" },
        { key: "bye", value: "Bye" },
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe("getSupportedLocales", () => {
    it("returns unique locales", async () => {
      jest
        .spyOn(service, "listTranslations")
        .mockResolvedValue([
          { locale: "en" },
          { locale: "ar" },
          { locale: "en" },
          { locale: "fr" },
        ]);

      const result = await service.getSupportedLocales("t1");
      expect(result).toEqual(expect.arrayContaining(["en", "ar", "fr"]));
      expect(result).toHaveLength(3);
    });

    it("returns empty array when no translations", async () => {
      vi.spyOn(service, "listTranslations").mockResolvedValue([]);

      const result = await service.getSupportedLocales("t1");
      expect(result).toEqual([]);
    });
  });
});
