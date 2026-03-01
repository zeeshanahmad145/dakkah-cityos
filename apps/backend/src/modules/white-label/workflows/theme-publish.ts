import {
  createStep,
  createWorkflow,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

// ─── Steps ────────────────────────────────────────────────────────────────────

const applyTenantBranding = createStep(
  "apply-tenant-branding",
  async (
    input: {
      tenantId: string;
      brandName?: string;
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      customDomain?: string;
    },
    { container },
  ) => {
    const whiteLabelService = container.resolve("white-label") as unknown as any;
    const config = await whiteLabelService.upsertConfig(input.tenantId, {
      brandName: input.brandName,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      customDomain: input.customDomain,
    });
    return new StepResponse(config);
  },
);

const publishWhiteLabelTheme = createStep(
  "publish-white-label-theme",
  async (input: { themeId: string }, { container }) => {
    const whiteLabelService = container.resolve("white-label") as unknown as any;
    const theme = await whiteLabelService.publishTheme(input.themeId);
    return new StepResponse(theme, { themeId: input.themeId });
  },
  async ({ themeId }: { themeId: string }, { container }) => {
    const whiteLabelService = container.resolve("white-label") as unknown as any;
    await whiteLabelService
      .updateWhiteLabelThemes({ id: themeId, is_published: false })
      .catch(() => null);
  },
);

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const themePublishWorkflow = createWorkflow(
  "theme-publish",
  // @ts-ignore: workflow builder return type
  (input: {
    tenantId: string;
    themeId: string;
    brandName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
  }) => {
    const brandingConfig = applyTenantBranding({
      tenantId: input.tenantId,
      brandName: input.brandName,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      customDomain: input.customDomain,
    });
    const publishedTheme = publishWhiteLabelTheme({ themeId: input.themeId });
    return { brandingConfig, publishedTheme };
  },
);
