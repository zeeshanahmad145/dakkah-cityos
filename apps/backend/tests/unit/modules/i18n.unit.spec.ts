jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listTranslations(_filter: any): Promise<any> {
          return [];
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
    Module: (_config: any) => ({}),
  };
});

import I18nModuleService from "../../../src/modules/i18n/service";

describe("I18nModuleService", () => {
  let service: I18nModuleService;

  beforeEach(() => {
    service = new I18nModuleService();
    jest.clearAllMocks();
  });

  describe("getTranslations", () => {
    it("returns translations for tenant and locale", async () => {
      const translations = [
        { id: "t-1", key: "welcome", value: "Hello", locale: "en" },
      ];
      jest.spyOn(service, "listTranslations").mockResolvedValue(translations);

      const result = await service.getTranslations("tenant-1", "en");

      expect(result).toEqual(translations);
    });

    it("filters by namespace when provided", async () => {
      const spy = jest.spyOn(service, "listTranslations").mockResolvedValue([]);

      await service.getTranslations("tenant-1", "en", "checkout");

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: "checkout",
          locale: "en",
          status: "published",
        }),
      );
    });
  });

  describe("getTranslation", () => {
    it("returns single translation by key", async () => {
      jest
        .spyOn(service, "listTranslations")
        .mockResolvedValue([{ id: "t-1", key: "welcome", value: "Hello" }]);

      const result = await service.getTranslation("tenant-1", "en", "welcome");

      expect(result).toEqual(expect.objectContaining({ key: "welcome" }));
    });

    it("returns null when translation not found", async () => {
      jest.spyOn(service, "listTranslations").mockResolvedValue([]);

      const result = await service.getTranslation(
        "tenant-1",
        "en",
        "nonexistent",
      );

      expect(result).toBeNull();
    });
  });

  describe("upsertTranslation", () => {
    it("creates new translation when not existing", async () => {
      jest.spyOn(service, "listTranslations").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createTranslations")
        .mockResolvedValue({ id: "t-new" });

      await service.upsertTranslation("tenant-1", "en", "greeting", "Hi");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "greeting",
          value: "Hi",
          namespace: "common",
        }),
      );
    });

    it("updates existing translation", async () => {
      jest
        .spyOn(service, "listTranslations")
        .mockResolvedValue([{ id: "t-1", key: "greeting", value: "Hello" }]);
      const updateSpy = jest
        .spyOn(service, "updateTranslations")
        .mockResolvedValue({ id: "t-1" });

      await service.upsertTranslation("tenant-1", "en", "greeting", "Hi there");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "t-1", value: "Hi there" }),
      );
    });
  });

  describe("bulkUpsert", () => {
    it("processes multiple translations", async () => {
      jest.spyOn(service, "listTranslations").mockResolvedValue([]);
      jest
        .spyOn(service, "createTranslations")
        .mockResolvedValue({ id: "t-new" });

      const translations = [
        { key: "hello", value: "Hello" },
        { key: "bye", value: "Goodbye" },
      ];
      const results = await service.bulkUpsert("tenant-1", "en", translations);

      expect(results).toHaveLength(2);
    });
  });

  describe("getSupportedLocales", () => {
    it("returns unique locales from translations", async () => {
      jest
        .spyOn(service, "listTranslations")
        .mockResolvedValue([
          { locale: "en" },
          { locale: "ar" },
          { locale: "en" },
          { locale: "fr" },
        ]);

      const locales = await service.getSupportedLocales("tenant-1");

      expect(locales).toContain("en");
      expect(locales).toContain("ar");
      expect(locales).toContain("fr");
      expect(locales).toHaveLength(3);
    });
  });
});
