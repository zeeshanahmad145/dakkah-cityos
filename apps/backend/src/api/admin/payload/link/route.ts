import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import { PAYLOAD_MODULE } from "../../../../modules/payload";
import ProductModule from "@medusajs/medusa/product";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Payload CMS calls this endpoint after successfully creating a product in Medusa
 * so that Medusa can link the internal product ID to the Payload document ID.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { product_id, payload_id, collection_slug } = req.body as {
    product_id: string;
    payload_id: string;
    collection_slug: string;
  };

  if (!product_id || !payload_id || !collection_slug) {
    return res.status(400).json({
      error: "Missing required fields: product_id, payload_id, collection_slug",
    });
  }

  try {
    // 1. Create the Payload Record locally via the module service directly
    // Since RemoteLink expects an existing record, we must insert it to `payload_record` first
    const payloadModule = req.scope.resolve(PAYLOAD_MODULE) as unknown as any;
    const record = await payloadModule.createPayloadRecords({
      payload_id,
      collection_slug,
    });

    // 2. Wrap RemoteLink in a workflow for safe DB execution
    const linkWorkflow = createWorkflow("create-payload-link", () => {
      createRemoteLinkStep([
        {
          [ProductModule.linkable.product.linkable]: {
            product_id,
          },
          [PAYLOAD_MODULE]: {
            payload_record_id: record.id,
          },
        },
      ]);
      return new WorkflowResponse({ success: true });
    });

    await linkWorkflow(req.scope).run();

    res.json({
      success: true,
      message: "Payload document successfully linked to Medusa Product",
    });
  } catch (error: unknown) {
    req.scope
      .resolve("logger")
      .error(
        `[PayloadLinkAPI] Failed to link product ${product_id}: ${(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error))}`,
      );
    res.status(500).json({ error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) });
  }
};
