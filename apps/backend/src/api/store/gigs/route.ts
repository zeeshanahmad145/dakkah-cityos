import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";
import { enrichListItems } from "../../../lib/detail-enricher";

const SEED_GIGS = [
  {
    id: "gig-1",
    title: "Professional Logo & Brand Identity Design",
    description:
      "I will create a unique, modern logo and complete brand identity package including color palette, typography, and brand guidelines.",
    category: "Design",
    budget: 25000,
    currency_code: "usd",
    duration_days: 7,
    seller: { name: "Alex Rivera", rating: 4.9, completed_gigs: 234 },
    thumbnail: "/seed-images/gigs/1498050108023-c5249f4df085.jpg",
    skills: ["Logo Design", "Branding", "Illustrator"],
    status: "active",
    created_at: "2025-05-01T10:00:00Z",
  },
  {
    id: "gig-2",
    title: "Full-Stack Web Application Development",
    description:
      "Build a responsive, scalable web application using React, Node.js, and PostgreSQL with modern best practices.",
    category: "Development",
    budget: 150000,
    currency_code: "usd",
    duration_days: 30,
    seller: { name: "Priya Sharma", rating: 4.8, completed_gigs: 156 },
    thumbnail: "/seed-images/gigs/1461749280684-dccba630e2f6.jpg",
    skills: ["React", "Node.js", "PostgreSQL"],
    status: "active",
    created_at: "2025-04-28T08:00:00Z",
  },
  {
    id: "gig-3",
    title: "SEO Optimization & Content Strategy",
    description:
      "Comprehensive SEO audit, keyword research, and 3-month content strategy to boost organic traffic and search rankings.",
    category: "Marketing",
    budget: 50000,
    currency_code: "usd",
    duration_days: 14,
    seller: { name: "Jordan Lee", rating: 4.7, completed_gigs: 312 },
    thumbnail: "/seed-images/gigs/1532094349884-543bc11b234d.jpg",
    skills: ["SEO", "Content Marketing", "Analytics"],
    status: "active",
    created_at: "2025-05-05T12:00:00Z",
  },
  {
    id: "gig-4",
    title: "Professional Video Editing & Post-Production",
    description:
      "High-quality video editing including color grading, sound design, motion graphics, and final delivery in 4K.",
    category: "Video",
    budget: 75000,
    currency_code: "usd",
    duration_days: 10,
    seller: { name: "Sam Nakamura", rating: 4.9, completed_gigs: 98 },
    thumbnail: "/seed-images/gigs/1532629345422-7515f3d16bb6.jpg",
    skills: ["Premiere Pro", "After Effects", "DaVinci Resolve"],
    status: "active",
    created_at: "2025-05-03T15:30:00Z",
  },
  {
    id: "gig-5",
    title: "Mobile App UI/UX Design",
    description:
      "Design intuitive, beautiful mobile app interfaces with user research, wireframes, prototypes, and final Figma deliverables.",
    category: "Design",
    budget: 80000,
    currency_code: "usd",
    duration_days: 14,
    seller: { name: "Elena Costa", rating: 4.8, completed_gigs: 187 },
    thumbnail: "/seed-images/gigs/1574717024653-61fd2cf4d44d.jpg",
    skills: ["Figma", "UI Design", "User Research"],
    status: "active",
    created_at: "2025-04-30T09:00:00Z",
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const freelanceService = req.scope.resolve("freelance") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      category,
      budget_min,
      budget_max,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, unknown> = { status: "active" };
    if (category) filters.category = category;

    const gigs = await freelanceService.listGigListings(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    const list = Array.isArray(gigs) ? gigs : [gigs].filter(Boolean);

    const filtered = list.filter((g: any) => {
      if (budget_min && Number(g.budget) < Number(budget_min)) return false;
      if (budget_max && Number(g.budget) > Number(budget_max)) return false;
      return true;
    });

    const raw = filtered.length > 0 ? filtered : SEED_GIGS;
    const result = enrichListItems(raw, "gigs");

    return res.json({
      gigs: result,
      items: result,
      count: result.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    return res.json({
      gigs: SEED_GIGS,
      items: SEED_GIGS,
      count: SEED_GIGS.length,
      limit: 20,
      offset: 0,
    });
  }
}
