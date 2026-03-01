/**
 * Order → Domain Record Subscriber — Complete Multi-Vertical Dispatcher
 *
 * Fires on order.placed. Reads each line item's product vertical metadata
 * and creates the corresponding domain record in the appropriate module.
 *
 * Supported verticals:
 *   fitness       → activates GymMembership
 *   booking       → confirms Booking slot
 *   legal         → creates LegalConsultation
 *   restaurant    → creates KitchenOrder
 *   travel        → creates Reservation
 *   crowdfunding  → creates Pledge + increments raised_amount
 *   insurance     → activates InsurancePolicy
 *   subscription  → creates Subscription record
 *   print-on-demand → calls submitPodOrder()
 */
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { FITNESS_MODULE } from "../modules/fitness";
import { BOOKING_MODULE } from "../modules/booking";
import { LEGAL_MODULE } from "../modules/legal";
import type {
  IFitnessModuleService,
  IBookingModuleService,
  ILegalModuleService,
  ILegalConsultation,
  IPrintOnDemandModuleService,
} from "../types/module-services";

/** Typed helpers for container services that lack exported interfaces */
interface ILogger {
  info?(msg: string): void;
  error?(msg: string): void;
  warn?(msg: string): void;
}

/** Medusa DI container minimal interface */
interface IContainer {
  resolve(key: string): unknown;
}

/** Typed order record as returned by IOrderService.listOrders */
interface OMetadata {
  tenant_id?: string;
  booking_slot?: Record<string, unknown>;
  legal?: Record<string, unknown>;
  restaurant?: Record<string, unknown>;
  travel?: Record<string, unknown>;
  crowdfunding?: Record<string, unknown>;
  insurance?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  [key: string]: unknown;
}

interface OLineItem {
  id?: string;
  product_id?: string;
  variant_id?: string;
  quantity?: number;
  unit_price?: number;
  metadata?: Record<string, unknown>;
}

interface OOrder {
  id: string;
  customer_id: string;
  metadata?: OMetadata;
  items?: OLineItem[];
}

interface IOrderService {
  listOrders(
    filters: Record<string, unknown>,
    config?: { relations?: string[] },
  ): Promise<OOrder[]>;
}

interface IRestaurantService {
  createKitchenOrders(data: Record<string, unknown>[]): Promise<void>;
}

interface ITravelService {
  createReservations(data: Record<string, unknown>[]): Promise<void>;
}

interface ICrowdfundingService {
  createPledges(data: Record<string, unknown>[]): Promise<void>;
  listCrowdfundCampaigns(
    filters: Record<string, unknown>,
    config?: Record<string, unknown>,
  ): Promise<
    Array<{ id: string; raised_amount?: number; backer_count?: number }>
  >;
  updateCrowdfundCampaigns(data: Record<string, unknown>[]): Promise<void>;
}

interface IInsuranceService {
  createInsPolicies(data: Record<string, unknown>[]): Promise<void>;
}

interface ISubscriptionService {
  createSubscriptions(data: Record<string, unknown>[]): Promise<void>;
}

// ─── Vertical handlers ─────────────────────────────────────────────────────────

async function handleFitness(
  order: OOrder,
  productId: string,
  container: IContainer,
  remoteQuery: (q: Record<string, unknown>) => Promise<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remoteLink: any,
): Promise<void> {
  const fitnessService = container.resolve(
    FITNESS_MODULE,
  ) as IFitnessModuleService;

  // Look up the linked GymMembership plan template via the join table
  const linked = (await remoteQuery({
    entryPoint: "gym_membership",
    fields: ["id", "membership_type"],
    variables: {},
  })) as any[];

  if (!linked?.[0]) return;

  const [membership] = await fitnessService.createGymMemberships([
    {
      tenant_id: order.metadata?.tenant_id ?? "",
      customer_id: order.customer_id,
      order_id: order.id,
      membership_type: linked[0].membership_type ?? "basic",
      status: "active",
      start_date: new Date(),
      auto_renew: true,
      freeze_count: 0,
      max_freezes: 2,
    },
  ]);

  await remoteLink.create({
    [FITNESS_MODULE]: { gym_membership_id: membership.id },
    order: { order_id: order.id },
  });
}

async function handleBooking(
  order: OOrder,
  container: IContainer,
): Promise<void> {
  const bookingService = container.resolve(
    BOOKING_MODULE,
  ) as IBookingModuleService;
  const slot = order.metadata?.booking_slot as
    | Record<string, unknown>
    | undefined;
  if (!slot) return;

  await bookingService.createBookings([
    {
      tenant_id: order.metadata?.tenant_id ?? "",
      customer_id: order.customer_id,
      order_id: order.id,
      service_product_id: slot.service_product_id as string,
      scheduled_at: slot.scheduled_at as string,
      status: "confirmed",
      notes: (slot.notes as string) ?? null,
    },
  ]);
}

async function handleLegal(
  order: OOrder,
  container: IContainer,
): Promise<void> {
  const legalService = container.resolve(LEGAL_MODULE) as ILegalModuleService;
  const legalMeta = order.metadata?.legal as
    | Record<string, unknown>
    | undefined;
  if (!legalMeta) return;

  await legalService.createLegalConsultations([
    {
      tenant_id: order.metadata?.tenant_id ?? "",
      attorney_id: legalMeta.attorney_id as string,
      client_id: order.customer_id,
      case_id: (legalMeta.case_id as string) ?? null,
      order_id: order.id,
      consultation_type: (legalMeta.consultation_type ??
        "initial") as unknown as ILegalConsultation["consultation_type"],

      status: "scheduled",
      scheduled_at: new Date(legalMeta.scheduled_at as string),
      duration_minutes: Number(legalMeta.duration_minutes ?? 60),
      is_virtual: Boolean(legalMeta.is_virtual ?? false),
      virtual_link: (legalMeta.virtual_link as string) ?? null,
    },
  ]);
}

async function handleRestaurant(
  order: OOrder,
  container: IContainer,
): Promise<void> {
  const restaurantService = container.resolve(
    "restaurant",
  ) as unknown as IRestaurantService;
  const restaurantMeta = order.metadata?.restaurant as
    | Record<string, unknown>
    | undefined;

  await restaurantService.createKitchenOrders([
    {
      tenant_id: order.metadata?.tenant_id ?? "",
      order_id: order.id,
      customer_id: order.customer_id,
      restaurant_id: restaurantMeta?.restaurant_id ?? null,
      table_number: restaurantMeta?.table_number ?? null,
      status: "received",
      notes: restaurantMeta?.notes ?? null,
      item_count: order.items?.length ?? 0,
    },
  ]);
}

async function handleTravel(
  order: OOrder,
  container: IContainer,
): Promise<void> {
  const travelService = container.resolve(
    "travel",
  ) as unknown as ITravelService;
  const travelMeta = order.metadata?.travel as
    | Record<string, unknown>
    | undefined;
  if (!travelMeta) return;

  await travelService.createReservations([
    {
      tenant_id: order.metadata?.tenant_id ?? "",
      order_id: order.id,
      customer_id: order.customer_id,
      property_id: travelMeta.property_id as string,
      room_type_id: (travelMeta.room_type_id as string) ?? null,
      check_in_date: new Date(travelMeta.check_in_date as string),
      check_out_date: new Date(travelMeta.check_out_date as string),
      guest_count: Number(travelMeta.guest_count ?? 1),
      status: "confirmed",
      special_requests: (travelMeta.special_requests as string) ?? null,
    },
  ]);
}

async function handleCrowdfunding(
  order: OOrder,
  container: IContainer,
  lineItem: OLineItem,
): Promise<void> {
  const crowdfundingService = container.resolve(
    "crowdfunding",
  ) as unknown as ICrowdfundingService;
  const cfMeta = order.metadata?.crowdfunding as
    | Record<string, unknown>
    | undefined;
  if (!cfMeta) return;

  // Create pledge record
  await crowdfundingService.createPledges([
    {
      tenant_id: order.metadata?.tenant_id ?? "",
      order_id: order.id,
      campaign_id: cfMeta.campaign_id as string,
      backer_id: order.customer_id,
      amount: lineItem.unit_price ?? 0,
      reward_tier_id: (cfMeta.reward_tier_id as string) ?? null,
      status: "confirmed",
    },
  ]);

  // Increment raised_amount on the campaign
  const [campaign] = await crowdfundingService.listCrowdfundCampaigns(
    { id: cfMeta.campaign_id },
    { take: 1 },
  );
  if (campaign) {
    await crowdfundingService.updateCrowdfundCampaigns([
      {
        id: campaign.id,
        raised_amount:
          (campaign.raised_amount ?? 0) + (lineItem.unit_price ?? 0),
        backer_count: (campaign.backer_count ?? 0) + 1,
      },
    ]);
  }
}

async function handleInsurance(
  order: OOrder,
  container: IContainer,
): Promise<void> {
  const insuranceService = container.resolve(
    "insurance",
  ) as unknown as IInsuranceService;
  const insMeta = order.metadata?.insurance as
    | Record<string, unknown>
    | undefined;
  if (!insMeta) return;

  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  await insuranceService.createInsPolicies([
    {
      customer_id: order.customer_id,
      order_id: order.id,
      plan_type: insMeta.plan_type as string,
      coverage_amount: Number(insMeta.coverage_amount ?? 0),
      premium: Number(insMeta.premium ?? 0),
      start_date: now,
      end_date: endDate,
      status: "active",
      policy_number: `POL-${String(order.id).slice(-8).toUpperCase()}-${Date.now()}`,
    },
  ]);
}

async function handlePrintOnDemand(
  order: OOrder,
  container: IContainer,
  lineItem: OLineItem,
): Promise<void> {
  const podService = container.resolve(
    "printOnDemand",
  ) as IPrintOnDemandModuleService;
  const podMeta = lineItem.metadata?.pod as Record<string, unknown> | undefined;
  if (!podMeta?.pod_product_id) return;

  await podService.submitPodOrder({
    orderId: order.id,
    podProductId: podMeta.pod_product_id as string,
    customizationData: podMeta.customization_data as
      | Record<string, unknown>
      | undefined,
    quantity: lineItem.quantity ?? 1,
  });
}

async function handleSubscription(
  order: OOrder,
  container: IContainer,
): Promise<void> {
  const subscriptionService = container.resolve(
    "subscription",
  ) as unknown as ISubscriptionService;
  const subMeta = order.metadata?.subscription as
    | Record<string, unknown>
    | undefined;
  if (!subMeta) return;

  await subscriptionService.createSubscriptions([
    {
      tenant_id: order.metadata?.tenant_id ?? "",
      customer_id: order.customer_id,
      order_id: order.id,
      plan_id: subMeta.plan_id as string,
      status: "active",
      started_at: new Date(),
      current_period_start: new Date(),
    },
  ]);
}

// ─── Main subscriber ───────────────────────────────────────────────────────────

export default async function orderToBookableServiceSubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id;
  const logger = container.resolve("logger") as unknown as ILogger;

  const orderService = container.resolve("order") as unknown as IOrderService;
  const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  const [order] = await orderService.listOrders(
    { id: [orderId] },
    { relations: ["items"] },
  );

  if (!order?.items?.length) return;

  for (const item of (order.items ?? []) as OLineItem[]) {
    const productId = item.product_id;
    if (!productId) continue;

    // Look up vertical metadata from product
    const productRows = (await remoteQuery({
      entryPoint: "product",
      variables: { filters: { id: productId } },
      fields: ["id", "metadata"],
    })) as any[];

    const vertical = productRows?.[0]?.metadata?.vertical as string | undefined;
    if (!vertical) continue;

    try {
      switch (vertical) {
        case "fitness":
          await handleFitness(
            order,
            productId,
            container,
            remoteQuery,
            remoteLink,
          );
          break;
        case "booking":
          await handleBooking(order, container);
          break;
        case "legal":
          await handleLegal(order, container);
          break;
        case "restaurant":
          await handleRestaurant(order, container);
          break;
        case "travel":
          await handleTravel(order, container);
          break;
        case "crowdfunding":
          await handleCrowdfunding(order, container, item);
          break;
        case "insurance":
          await handleInsurance(order, container);
          break;
        case "subscription":
          await handleSubscription(order, container);
          break;
        case "print-on-demand":
          await handlePrintOnDemand(order, container, item);
          break;
        default:
          logger.info?.(
            `[order-dispatcher] Unknown vertical "${vertical}" for product ${productId}`,
          );
      }

      logger.info?.(
        `[order-dispatcher] Dispatched vertical="${vertical}" for order ${orderId}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error?.(
        `[order-dispatcher] Failed vertical="${vertical}" for order ${orderId}: ${msg}`,
      );
      // Non-blocking: continue processing remaining line items even if one fails
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
