import { MedusaService } from "@medusajs/framework/utils";
import Translation from "./models/translation";

class I18nModuleService extends MedusaService({
  Translation,
}) {
  async getTranslations(tenantId: string, locale: string, namespace?: string) {
    const query: Record<string, any> = {
      tenant_id: tenantId,
      locale,
      status: "published",
    };

    if (namespace) {
      query.namespace = namespace;
    }

    const translations = await this.listTranslations(query) as any;
    return Array.isArray(translations)
      ? translations
      : [translations].filter(Boolean);
  }

  async getTranslation(
    tenantId: string,
    locale: string,
    key: string,
    namespace?: string,
  ) {
    const query: Record<string, any> = {
      tenant_id: tenantId,
      locale,
      key,
    };

    if (namespace) {
      query.namespace = namespace;
    }

    const translations = await this.listTranslations(query) as any;
    const list = Array.isArray(translations)
      ? translations
      : [translations].filter(Boolean);
    return list[0] || null;
  }

  async upsertTranslation(
    tenantId: string,
    locale: string,
    key: string,
    value: string,
    namespace?: string,
  ) {
    const ns = namespace || "common";
    const existing = await this.getTranslation(tenantId, locale, key, ns);

    if (existing) {
      return await this.updateTranslations({
        id: existing.id,
        value,
        status: "published",
      } as any);
    }

    return await this.createTranslations({
      tenant_id: tenantId,
      locale,
      namespace: ns,
      key,
      value,
      status: "published",
    } as any);
  }

  async bulkUpsert(
    tenantId: string,
    locale: string,
    translations: { key: string; value: string; namespace?: string }[],
  ) {
    const results: any[] = [];

    for (const t of translations) {
      const result = await this.upsertTranslation(
        tenantId,
        locale,
        t.key,
        t.value,
        t.namespace,
      );
      results.push(result);
    }

    return results;
  }

  async getSupportedLocales(tenantId: string) {
    const translations = await this.listTranslations({
      tenant_id: tenantId,
      status: "published",
    }) as any;

    const list = Array.isArray(translations)
      ? translations
      : [translations].filter(Boolean);
    const locales = new Set<string>();

    for (const t of list) {
      locales.add(t.locale);
    }

    return Array.from(locales);
  }
}

export default I18nModuleService;
