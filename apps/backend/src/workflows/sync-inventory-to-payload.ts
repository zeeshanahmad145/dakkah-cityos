import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { updatePayloadDocStep } from "./steps/update-payload-doc";

export const syncInventoryToPayloadWorkflow = createWorkflow(
  {
    name: "sync-inventory-to-payload",
  },
  (input: { inventoryItemId: string }) => {
    // We need to fetch the inventory item, then its related variant, then the variant's product
    // then the product's linked Payload record.
    const { data: inventoryItems } = useQueryGraphStep({
      entity: "inventory_item",
      fields: [
        "id",
        "stocked_quantity",
        "reserved_quantity",
        "variant.product.id",
        "variant.product.payload_record.*",
      ],
      filters: { id: input.inventoryItemId },
    });

    const payloadDocInfo = transform({ inventoryItems }, (data) => {
      const item = data.inventoryItems?.[0] as any;
      if (!item) return null;

      // Core calculation: Total stock minus reserved stock
      const availableUnits =
        (item.stocked_quantity || 0) - (item.reserved_quantity || 0);

      // Traverse through variant to product to link
      const product = item?.variant?.product;
      if (!product || !product.payload_record) {
        return null;
      }

      return {
        collection: product.payload_record.collection_slug,
        id: product.payload_record.payload_id,
        data: {
          availableUnits,
        },
      };
    });

    const result = updatePayloadDocStep(payloadDocInfo);

    return new WorkflowResponse(result);
  },
);
