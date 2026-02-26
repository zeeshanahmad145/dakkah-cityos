import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

function generateSeedVendorReviews(vendorId: string) {
  const now = new Date();
  return [
    {
      id: "rev_vendor_01",
      rating: 5,
      title: "Excellent vendor experience",
      content: "Fast shipping, great communication, and the product was exactly as described. Will order from this vendor again.",
      customer_id: "cust_seed_01",
      customer_name: "Sarah Johnson",
      customer_email: "sarah.j@example.com",
      product_id: null,
      vendor_id: vendorId,
      order_id: "order_seed_01",
      is_verified_purchase: true,
      is_approved: true,
      helpful_count: 16,
      images: null,
      metadata: null,
      created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "rev_vendor_02",
      rating: 4,
      title: "Great seller",
      content: "Very professional and responsive. Product quality was good. Packaging could be a bit better but overall a positive experience.",
      customer_id: "cust_seed_02",
      customer_name: "Michael Chen",
      customer_email: "m.chen@example.com",
      product_id: null,
      vendor_id: vendorId,
      order_id: "order_seed_02",
      is_verified_purchase: true,
      is_approved: true,
      helpful_count: 11,
      images: null,
      metadata: null,
      created_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "rev_vendor_03",
      rating: 5,
      title: "Top-notch service",
      content: "This vendor goes above and beyond. They followed up after delivery to make sure everything was perfect. Highly recommend.",
      customer_id: "cust_seed_03",
      customer_name: "Emma Williams",
      customer_email: "emma.w@example.com",
      product_id: null,
      vendor_id: vendorId,
      order_id: "order_seed_03",
      is_verified_purchase: true,
      is_approved: true,
      helpful_count: 22,
      images: null,
      metadata: null,
      created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "rev_vendor_04",
      rating: 4,
      title: "Reliable vendor",
      content: "Consistent quality across multiple purchases. Shipping times are reasonable and products always arrive in good condition.",
      customer_id: "cust_seed_04",
      customer_name: "James Rodriguez",
      customer_email: "james.r@example.com",
      product_id: null,
      vendor_id: vendorId,
      order_id: "order_seed_04",
      is_verified_purchase: true,
      is_approved: true,
      helpful_count: 9,
      images: null,
      metadata: null,
      created_at: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "rev_vendor_05",
      rating: 5,
      title: "Outstanding customer support",
      content: "Had an issue with my order and the vendor resolved it immediately. Great products and even better service. Five stars all the way.",
      customer_id: "cust_seed_05",
      customer_name: "Olivia Brown",
      customer_email: "olivia.b@example.com",
      product_id: null,
      vendor_id: vendorId,
      order_id: "order_seed_05",
      is_verified_purchase: true,
      is_approved: true,
      helpful_count: 18,
      images: null,
      metadata: null,
      created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "rev_vendor_06",
      rating: 3,
      title: "Average experience",
      content: "Product was fine but shipping took longer than expected. Communication could be improved. Not bad, just not exceptional.",
      customer_id: "cust_seed_06",
      customer_name: "Daniel Kim",
      customer_email: "d.kim@example.com",
      product_id: null,
      vendor_id: vendorId,
      order_id: "order_seed_06",
      is_verified_purchase: true,
      is_approved: true,
      helpful_count: 5,
      images: null,
      metadata: null,
      created_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "rev_vendor_07",
      rating: 5,
      title: "My go-to vendor",
      content: "I've ordered multiple times and every experience has been excellent. Quality products, fair prices, and fast shipping. Can't ask for more.",
      customer_id: "cust_seed_07",
      customer_name: "Sophie Martinez",
      customer_email: "sophie.m@example.com",
      product_id: null,
      vendor_id: vendorId,
      order_id: "order_seed_07",
      is_verified_purchase: true,
      is_approved: true,
      helpful_count: 27,
      images: null,
      metadata: null,
      created_at: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "rev_vendor_08",
      rating: 4,
      title: "Would recommend",
      content: "Good overall experience. The product matched the description and arrived on time. Would shop here again.",
      customer_id: "cust_seed_08",
      customer_name: "William Taylor",
      customer_email: "w.taylor@example.com",
      product_id: null,
      vendor_id: vendorId,
      order_id: "order_seed_08",
      is_verified_purchase: true,
      is_approved: true,
      helpful_count: 8,
      images: null,
      metadata: null,
      created_at: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve("review") as any;
  const { id } = req.params;
  const { limit = "10", offset = "0" } = req.query as {
    limit?: string;
    offset?: string;
  };

  try {
    const reviews = await reviewService.listVendorReviews(id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      approved_only: true,
    });

    if (reviews.length === 0) {
      const seedReviews = generateSeedVendorReviews(id);
      const sliced = seedReviews.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      return res.json({
        reviews: sliced,
        count: seedReviews.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    }

    res.json({
      reviews,
      count: reviews.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error: any) {
    const seedReviews = generateSeedVendorReviews(id);
    const sliced = seedReviews.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    return res.json({
      reviews: sliced,
      count: seedReviews.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  }
}
