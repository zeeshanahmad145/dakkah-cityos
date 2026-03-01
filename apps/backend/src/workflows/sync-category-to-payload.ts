import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { updatePayloadDocStep } from "./steps/update-payload-doc";

export const syncCategoryToPayloadWorkflow = createWorkflow(
  {
    name: "sync-category-to-payload",
  },
  (input: { categoryId: string }) => {
    // 1. Fetch exactly the category and its linked payload record
    const { data: categories } = useQueryGraphStep({
      entity: "product_category",
      fields: [
        "id",
        "name",
        "description",
        "handle",
        "parent_category_id",
        "is_active",
        "payload_record.*",
      ],
      filters: { id: input.categoryId },
    });

    // 2. Transform the data into the payload format
    const payloadDocInfo = transform({ categories }, (data) => {
      const category = data.categories?.[0];
      if (!category) return null;

      // Note: If a 'payload_record' doesn't exist, you'd typically have a separate step to CREATE it first,
      // but following the existing pattern from sync-product-to-payload:
      if (!(category as any).payload_record) {
        return {
          collection: "categories",
          id: category.id, // Or a matching ID if generating one
          data: {
            title: category.name,
            description: category.description,
            slug: category.handle,
            active: category.is_active,
            // Medusa v2 structural ID for Payload CMS reference
            medusa_id: category.id,
            parent: category.parent_category_id || null,
          },
        };
      }

      return {
        collection: (category as any).payload_record.collection_slug || "categories",
        id: (category as any).payload_record.payload_id,
        data: {
          title: category.name,
          description: category.description,
          slug: category.handle,
          active: category.is_active,
          parent: category.parent_category_id || null,
        },
      };
    });

    // 3. Execute the update step to Payload
    const result = updatePayloadDocStep(payloadDocInfo);

    return new WorkflowResponse(result);
  },
);

