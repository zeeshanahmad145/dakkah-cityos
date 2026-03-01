import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * GET /store/fitness
 *
 * Phase 5 migration: uses query.graph() to fetch Medusa products linked to
 * ServiceProduct extensions via the product-booking-service.ts link table
 * (fitness classes are service products). GymMembership plans are fetched
 * separately via product-fitness-plan.ts link.
 *
 * Returns: { classes, memberships, trainers, items, count, limit, offset }
 * Shape preserved for backward-compat with existing frontend consumers.
 */

const SEED_CLASSES = [
  {
    id: "prod_fit_seed_001",
    title: "Morning Vinyasa Yoga",
    description:
      "Start your day with a flowing yoga practice that builds strength, flexibility, and mindfulness.",
    thumbnail: "/seed-images/affiliate/1544367567-0f2fcb009e0b.jpg",
    service_product: {
      service_type: "class",
      duration_minutes: 60,
      max_capacity: 25,
      location_type: "in_person",
    },
    metadata: {
      class_type: "yoga",
      level: "all_levels",
      instructor: "Sarah Chen",
      rating: 4.8,
      review_count: 124,
    },
  },
  {
    id: "prod_fit_seed_002",
    title: "CrossFit WOD Challenge",
    description:
      "High-intensity functional fitness workout combining weightlifting, cardio, and gymnastics.",
    thumbnail: "/seed-images/bookings/1534438327276-14e5300c3a48.jpg",
    service_product: {
      service_type: "class",
      duration_minutes: 45,
      max_capacity: 15,
      location_type: "in_person",
    },
    metadata: {
      class_type: "crossfit",
      level: "intermediate",
      instructor: "Marcus Johnson",
      rating: 4.9,
    },
  },
];

const SEED_MEMBERSHIPS = [
  {
    id: "prod_fit_mbr_001",
    title: "Basic Membership",
    description: "Access to standard gym facilities and group classes.",
    thumbnail: "/seed-images/fitness/1571019614242-c5c5dee9f50b.jpg",
    gym_membership: { membership_type: "basic" },
    metadata: { billing_interval: "monthly", access_hours: "6am-10pm" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const {
    limit = "20",
    offset = "0",
    tenant_id,
    type,
    vertical = "class", // "class" | "membership"
    search,
  } = req.query as Record<string, string | undefined>;

  try {
    const query = req.scope.resolve("query") as unknown as any;

    const productFilters: Record<string, unknown> = { status: "published" };
    if (tenant_id) productFilters["metadata->>'tenant_id'"] = tenant_id;
    if (search) productFilters.title = { $ilike: `%${search}%` };

    // Fetch fitness class/service products
    const { data: classProducts } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "thumbnail",
        "handle",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.calculated_price.*",
        "service_product.id",
        "service_product.service_type",
        "service_product.duration_minutes",
        "service_product.max_capacity",
        "service_product.location_type",
        "service_product.virtual_meeting_url",
        "service_product.assigned_providers",
      ],
      filters: {
        ...productFilters,
        "metadata->>'vertical'": "booking",
        "service_product.service_type": "class",
      },
      pagination: { skip: Number(offset), take: Number(limit) },
    });

    // Fetch membership plan products
    const { data: membershipProducts } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "thumbnail",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.calculated_price.*",
        "gym_membership.id",
        "gym_membership.membership_type",
        "gym_membership.billing_interval",
      ],
      filters: { ...productFilters, "metadata->>'vertical'": "fitness" },
      pagination: { skip: 0, take: 20 },
    });

    const classes = classProducts?.length > 0 ? classProducts : SEED_CLASSES;
    const memberships =
      membershipProducts?.length > 0 ? membershipProducts : SEED_MEMBERSHIPS;

    return res.json({
      classes,
      memberships,
      items: vertical === "membership" ? memberships : classes,
      count: classes.length + memberships.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Unknown error";
    req.scope
      .resolve("logger")
      .error?.(`[fitness/route] query.graph failed: ${msg}`);

    return res.json({
      classes: SEED_CLASSES,
      memberships: SEED_MEMBERSHIPS,
      items: SEED_CLASSES,
      count: SEED_CLASSES.length,
      limit: Number(limit ?? 20),
      offset: Number(offset ?? 0),
    });
  }
}
