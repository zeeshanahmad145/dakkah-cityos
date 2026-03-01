import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { appConfig } from "../lib/config";

export type SyncPageInput = {
  id: string;
};

const syncPageApiStep = createStep(
  "sync-page-to-payload-step",
  async (input: SyncPageInput, { container }) => {
    try {
      if (!appConfig.payloadCms.isConfigured) {
        return new StepResponse<any, any>({
          status: "skipped",
          message: "Payload CMS not configured",
        });
      }

      const query = container.resolve("query") as unknown as any;

      const { data: pages } = await query.graph({
        entity: "cms_page",
        fields: ["*", "metadata"],
        filters: { id: input.id },
      });

      const page = pages[0];
      if (!page) {
        return new StepResponse<any, any>({
          status: "error",
          message: `Page ${input.id} not found`,
        });
      }

      // Map Drizzle cms_page schema to Payload 'Pages' collection shape
      const payloadData = {
        title: page.title,
        slug: page.slug,
        status: page.status,
        meta: {
          title: page.seo_title || page.title,
          description: page.seo_description || "",
          image: page.seo_image || null,
        },
        layout: page.layout || [], // JSON grid structure
        _tenant_id: page.tenant_id,
        locale: page.locale,
      };

      // We attempt to find an existing page by slug via query parameter
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appConfig.payloadCms.apiKey}`,
      };

      const searchRes = await fetch(
        `${appConfig.payloadCms.url}/api/pages?where[slug][equals]=${page.slug}`,
        { headers },
      );

      if (!searchRes.ok) {
        throw new Error(`Failed to query Payload API: ${searchRes.statusText}`);
      }

      const searchData = await searchRes.json();
      const existingPage = searchData.docs?.[0];

      let method = "POST";
      let endpoint = `${appConfig.payloadCms.url}/api/pages`;

      if (existingPage) {
        method = "PATCH";
        endpoint = `${appConfig.payloadCms.url}/api/pages/${existingPage.id}`;
      }

      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payloadData),
      });

      if (!res.ok) {
        throw new Error(`Failed to sync page to Payload: ${res.statusText}`);
      }

      return new StepResponse<any, any>({
        status: "success",
        data: await res.json(),
        method,
      });
    } catch (error: unknown) {
      return new StepResponse<any, any>({
        status: "error",
        message: (error instanceof Error ? error.message : String(error)),
      });
    }
  },
);

export const syncPageToPayloadWorkflow = createWorkflow(
  "sync-page-to-payload",
  function (input: SyncPageInput) {
    const result = syncPageApiStep(input);
    return new WorkflowResponse(result);
  },
);
