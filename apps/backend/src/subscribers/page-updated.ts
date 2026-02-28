import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { syncPageToPayloadWorkflow } from "../workflows/sync-page-to-payload";
import { subscriberLogger } from "../lib/logger";

const logger = subscriberLogger;

export default async function pageUpdatedHandler({
  event: { data, name },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const { result } = await syncPageToPayloadWorkflow(container).run({
      input: {
        id: data.id,
      },
    });

    const typedResult = result as { status: string; message?: string };

    if (typedResult.status === "skipped") {
      logger.info(`Payload CMS Page Sync skipped: ${typedResult.message}`, {
        pageId: data.id,
      });
      return;
    }

    if (typedResult.status === "error") {
      logger.error(
        `Payload CMS Page Sync error: ${typedResult.message}`,
        null,
        {
          pageId: data.id,
        },
      );
      return;
    }

    logger.info(`Successfully synced Page to Payload`, {
      pageId: data.id,
      event: name,
    });
  } catch (error) {
    logger.error("Payload CMS Page Sync fatal error", error, {
      pageId: data.id,
      event: name,
    });
  }
}

export const config: SubscriberConfig = {
  event: ["cms_page.created", "cms_page.updated"],
};
