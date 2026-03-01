import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

/**
 * Persona Segment Re-evaluation Subscriber
 * Listens to key customer activity events and re-evaluates segment membership.
 */
export default async function personaSegmentSubscriber({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string; customer_id?: string }>) {
  const customerId =
    data.customer_id || (name === "customer.updated" ? data.id : null);

  if (!customerId) return;

  try {
    const personaService = container.resolve("persona") as unknown as any;

    // Check if the service has evaluateSegment; if not, skip gracefully
    if (typeof personaService.evaluateSegmentsForCustomer !== "function") {
      return;
    }

    await personaService.evaluateSegmentsForCustomer(customerId);
    console.info(
      `[Persona] Re-evaluated segments for customer ${customerId} (event: ${name})`,
    );
  } catch (err: any) {
    console.error(
      `[Persona] Segment re-evaluation failed for customer ${customerId}:`,
      err.message,
    );
  }
}

export const config: SubscriberConfig = {
  event: ["order.completed", "order.placed", "customer.updated"],
};
