import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { updatePayloadDocStep } from "./steps/update-payload-doc";

export const syncProductToPayloadWorkflow = createWorkflow(
  "sync-product-to-payload",
  (input: { productId: string }) => {
    // 1. Fetch exactly the product and its linked payload record
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "title", "status", "payload_record.*"],
      filters: { id: input.productId },
    });

    // 2. Transform the data into the payload format
    // If not linked, return null so the step neatly skips.
    const payloadDocInfo = transform({ products }, (data) => {
      const product = data.products?.[0];
      if (!product || !product.payload_record) {
        return null;
      }

      return {
        collection: product.payload_record.collection_slug,
        id: product.payload_record.payload_id,
        data: {
          title: product.title,
          status: product.status === "published" ? "published" : "draft",
        },
      };
    });

    // 3. Execute the update step
    const result = updatePayloadDocStep(payloadDocInfo);

    return new WorkflowResponse(result);
  },
);
