import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const SEED_DATA = [
  {
    id: "dp-1",
    thumbnail: "/seed-images/digital-products/1517694712202-14dd9538aa97.jpg",
    title: "Complete Web Development Bootcamp",
    description:
      "Master HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course.",
    file_type: "video",
    file_size_bytes: 5368709120,
    preview_url: null,
    version: "3.0",
    max_downloads: null,
    is_active: true,
    metadata: {
      thumbnail: "/seed-images/digital-products/1517694712202-14dd9538aa97.jpg",
      price: 4999,
      category: "software",
      rating: 4.8,
      currency_code: "USD",
    },
  },
  {
    id: "dp-2",
    thumbnail: "/seed-images/digital-products/1545235617-9465d2a55698.jpg",
    title: "Premium UI Kit - Dashboard Templates",
    description:
      "200+ responsive dashboard components for Figma and Sketch with dark/light mode support.",
    file_type: "archive",
    file_size_bytes: 157286400,
    preview_url: null,
    version: "2.1",
    max_downloads: 5,
    is_active: true,
    metadata: {
      thumbnail: "/seed-images/digital-products/1545235617-9465d2a55698.jpg",
      price: 2999,
      category: "template",
      rating: 4.6,
      currency_code: "USD",
    },
  },
  {
    id: "dp-3",
    thumbnail: "/seed-images/digital-products/1544716278-ca5e3f4abd8c.jpg",
    title: "The Art of Digital Marketing - eBook",
    description:
      "A comprehensive guide covering SEO, social media, email marketing, and paid advertising strategies.",
    file_type: "ebook",
    file_size_bytes: 15728640,
    preview_url: null,
    version: "1.5",
    max_downloads: 3,
    is_active: true,
    metadata: {
      thumbnail: "/seed-images/digital-products/1544716278-ca5e3f4abd8c.jpg",
      price: 1499,
      category: "ebook",
      rating: 4.5,
      currency_code: "USD",
    },
  },
  {
    id: "dp-4",
    thumbnail: "/seed-images/classifieds/1511379938547-c1f69419868d.jpg",
    title: "Ambient Music Collection - Focus & Study",
    description:
      "50 high-quality ambient tracks perfect for deep work, studying, and meditation.",
    file_type: "audio",
    file_size_bytes: 1073741824,
    preview_url: null,
    version: "1.0",
    max_downloads: null,
    is_active: true,
    metadata: {
      thumbnail: "/seed-images/classifieds/1511379938547-c1f69419868d.jpg",
      price: 999,
      category: "audio",
      rating: 4.7,
      currency_code: "USD",
    },
  },
  {
    id: "dp-5",
    thumbnail: "/seed-images/digital-products/1506744038136-46273834b3fb.jpg",
    title: "Stock Photo Bundle - Nature & Landscapes",
    description:
      "500 high-resolution nature photographs licensed for commercial use in any project.",
    file_type: "image",
    file_size_bytes: 3221225472,
    preview_url: null,
    version: "1.2",
    max_downloads: 2,
    is_active: true,
    metadata: {
      thumbnail: "/seed-images/digital-products/1506744038136-46273834b3fb.jpg",
      price: 3999,
      category: "image",
      rating: 4.9,
      currency_code: "USD",
    },
  },
];

const createDigitalAssetSchema = z.object({
  tenant_id: z.string().min(1),
  product_id: z.string().min(1),
  title: z.string().min(1),
  file_url: z.string().min(1),
  file_type: z.enum([
    "pdf",
    "video",
    "audio",
    "image",
    "archive",
    "ebook",
    "software",
    "other",
  ]),
  file_size_bytes: z.number().optional(),
  preview_url: z.string().optional(),
  version: z.string().optional(),
  max_downloads: z.number().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("digitalProduct") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      file_type,
    } = req.query as Record<string, string | undefined>;
    const filters: Record<string, any> = {};
    if (tenant_id) filters.tenant_id = tenant_id;
    if (file_type) filters.file_type = file_type;
    filters.is_active = true;
    const items = await mod.listDigitalAssets(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    const itemList =
      Array.isArray(items) && items.length > 0 ? items : SEED_DATA;
    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    return res.json({
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit: 20,
      offset: 0,
    });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = req.auth_context?.actor_id;
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const parsed = createDigitalAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const mod = req.scope.resolve("digitalProduct") as unknown as any;
    const item = await mod.createDigitalAssets(parsed.data);
    res.status(201).json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-DIGITAL-PRODUCTS");
  }
}
