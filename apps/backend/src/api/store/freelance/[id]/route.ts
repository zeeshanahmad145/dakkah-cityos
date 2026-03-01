import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

const SEED_DATA = [
  {
    id: "free-seed-001",
    title: "Professional Website Development",
    description:
      "Full-stack web development using React, Node.js, and modern frameworks. Responsive design, SEO optimization, and performance tuning included.",
    category: "web_development",
    subcategory: "full_stack",
    listing_type: "fixed_price",
    currency_code: "SAR",
    thumbnail: "/seed-images/freelance/1461749280684-dccba630e2f6.jpg",
    metadata: {
      thumbnail: "/seed-images/freelance/1461749280684-dccba630e2f6.jpg",
      images: ["/seed-images/freelance/1461749280684-dccba630e2f6.jpg"],
      price: 5000,
      rating: 4.9,
    },
    delivery_time_days: 14,
    revisions_included: 3,
    status: "active",
    reviews: [
      {
        rating: 5,
        author: "Mohammed K.",
        comment:
          "Exceptional work! Delivered a stunning website ahead of schedule.",
        created_at: "2024-08-15T00:00:00Z",
      },
      {
        rating: 5,
        author: "Sara A.",
        comment:
          "Very professional and responsive. The code quality was top-notch.",
        created_at: "2024-08-10T00:00:00Z",
      },
      {
        rating: 4,
        author: "Ahmed R.",
        comment:
          "Great developer, minor delays but the final product was excellent.",
        created_at: "2024-07-28T00:00:00Z",
      },
      {
        rating: 5,
        author: "Fatima H.",
        comment: "Built exactly what I envisioned. Highly recommend!",
        created_at: "2024-07-20T00:00:00Z",
      },
      {
        rating: 4,
        author: "Omar T.",
        comment: "Good communication throughout the project. Will hire again.",
        created_at: "2024-07-15T00:00:00Z",
      },
    ],
    packages: [
      {
        name: "Basic",
        price: 2500,
        delivery_time: 7,
        description: "Simple landing page",
        features: [
          "1 page design",
          "Responsive layout",
          "Basic SEO",
          "1 revision",
        ],
      },
      {
        name: "Standard",
        price: 5000,
        delivery_time: 14,
        description: "Multi-page website",
        features: [
          "Up to 5 pages",
          "Responsive design",
          "SEO optimization",
          "3 revisions",
          "Contact form",
        ],
      },
      {
        name: "Premium",
        price: 10000,
        delivery_time: 21,
        description: "Full-stack web application",
        features: [
          "Unlimited pages",
          "Custom backend",
          "Database integration",
          "5 revisions",
          "Admin panel",
          "API development",
        ],
      },
    ],
    tiers: [
      {
        name: "Basic",
        price: 2500,
        delivery_days: 7,
        description: "Simple landing page with responsive layout and basic SEO",
      },
      {
        name: "Standard",
        price: 5000,
        delivery_days: 14,
        description:
          "Multi-page website with SEO optimization and contact form",
      },
      {
        name: "Premium",
        price: 10000,
        delivery_days: 21,
        description:
          "Full-stack web application with custom backend and admin panel",
      },
    ],
  },
  {
    id: "free-seed-002",
    title: "Brand Identity & Logo Design",
    description:
      "Complete brand identity package including logo, color palette, typography, and brand guidelines. Unique, memorable designs.",
    category: "design",
    subcategory: "branding",
    listing_type: "fixed_price",
    currency_code: "SAR",
    thumbnail: "/seed-images/freelance/1532094349884-543bc11b234d.jpg",
    metadata: {
      thumbnail: "/seed-images/freelance/1532094349884-543bc11b234d.jpg",
      images: ["/seed-images/freelance/1532094349884-543bc11b234d.jpg"],
      price: 3500,
      rating: 4.8,
    },
    delivery_time_days: 7,
    revisions_included: 5,
    status: "active",
    reviews: [
      {
        rating: 5,
        author: "Layla M.",
        comment:
          "The brand identity package was absolutely stunning. Exceeded expectations!",
        created_at: "2024-09-10T00:00:00Z",
      },
      {
        rating: 5,
        author: "Hassan B.",
        comment: "Creative and unique designs. My brand stands out now.",
        created_at: "2024-09-05T00:00:00Z",
      },
      {
        rating: 4,
        author: "Nadia S.",
        comment:
          "Beautiful logo work. The brand guidelines were very thorough.",
        created_at: "2024-08-28T00:00:00Z",
      },
      {
        rating: 5,
        author: "Khalid W.",
        comment: "Professional designer who truly understands branding.",
        created_at: "2024-08-20T00:00:00Z",
      },
      {
        rating: 4,
        author: "Reem D.",
        comment: "Great design sense and attention to detail.",
        created_at: "2024-08-15T00:00:00Z",
      },
    ],
    packages: [
      {
        name: "Basic",
        price: 1500,
        delivery_time: 3,
        description: "Logo design only",
        features: ["2 logo concepts", "1 revision", "PNG format"],
      },
      {
        name: "Standard",
        price: 3500,
        delivery_time: 7,
        description: "Logo + brand kit",
        features: [
          "4 logo concepts",
          "Color palette",
          "Typography guide",
          "3 revisions",
          "Vector files",
        ],
      },
      {
        name: "Premium",
        price: 7000,
        delivery_time: 14,
        description: "Complete brand identity",
        features: [
          "6 logo concepts",
          "Brand guidelines",
          "Business cards",
          "5 revisions",
          "Social media kit",
          "Stationery design",
        ],
      },
    ],
    tiers: [
      {
        name: "Basic",
        price: 1500,
        delivery_days: 3,
        description: "Logo design with 2 concepts and PNG format delivery",
      },
      {
        name: "Standard",
        price: 3500,
        delivery_days: 7,
        description:
          "Logo plus brand kit with color palette and typography guide",
      },
      {
        name: "Premium",
        price: 7000,
        delivery_days: 14,
        description:
          "Complete brand identity with guidelines and stationery design",
      },
    ],
  },
  {
    id: "free-seed-003",
    title: "SEO Content Writing & Blog Posts",
    description:
      "High-quality, SEO-optimized content writing for blogs, websites, and marketing materials. Research-driven and engaging.",
    category: "writing",
    subcategory: "content_writing",
    listing_type: "fixed_price",
    currency_code: "SAR",
    thumbnail: "/seed-images/freelance/1532629345422-7515f3d16bb6.jpg",
    metadata: {
      thumbnail: "/seed-images/freelance/1532629345422-7515f3d16bb6.jpg",
      images: ["/seed-images/freelance/1532629345422-7515f3d16bb6.jpg"],
      price: 1500,
      rating: 4.7,
    },
    delivery_time_days: 3,
    revisions_included: 2,
    status: "active",
    reviews: [
      {
        rating: 5,
        author: "Youssef N.",
        comment: "Incredible writing quality. Our blog traffic increased 40%!",
        created_at: "2024-07-10T00:00:00Z",
      },
      {
        rating: 4,
        author: "Amira L.",
        comment: "Well-researched articles that our audience loved.",
        created_at: "2024-07-05T00:00:00Z",
      },
      {
        rating: 5,
        author: "Tariq F.",
        comment: "SEO-optimized content that actually ranks. Very impressed.",
        created_at: "2024-06-28T00:00:00Z",
      },
      {
        rating: 5,
        author: "Dana K.",
        comment: "Consistent quality and always delivered on time.",
        created_at: "2024-06-20T00:00:00Z",
      },
      {
        rating: 4,
        author: "Mansour G.",
        comment: "Great writer with a strong understanding of our niche.",
        created_at: "2024-06-15T00:00:00Z",
      },
    ],
    packages: [
      {
        name: "Basic",
        price: 500,
        delivery_time: 1,
        description: "1 blog post",
        features: ["500-word article", "SEO keywords", "1 revision"],
      },
      {
        name: "Standard",
        price: 1500,
        delivery_time: 3,
        description: "3 blog posts",
        features: [
          "800-word articles",
          "SEO optimization",
          "Meta descriptions",
          "2 revisions",
        ],
      },
      {
        name: "Premium",
        price: 3500,
        delivery_time: 7,
        description: "Content strategy + posts",
        features: [
          "5 articles",
          "Keyword research",
          "Content calendar",
          "3 revisions",
          "Social snippets",
        ],
      },
    ],
    tiers: [
      {
        name: "Basic",
        price: 500,
        delivery_days: 1,
        description: "Single 500-word SEO-optimized blog post",
      },
      {
        name: "Standard",
        price: 1500,
        delivery_days: 3,
        description:
          "Three 800-word articles with SEO optimization and meta descriptions",
      },
      {
        name: "Premium",
        price: 3500,
        delivery_days: 7,
        description:
          "Full content strategy with 5 articles and keyword research",
      },
    ],
  },
  {
    id: "free-seed-004",
    title: "Professional Video Editing & Motion Graphics",
    description:
      "Expert video editing with color grading, motion graphics, sound design, and visual effects for YouTube, ads, and social media.",
    category: "video",
    subcategory: "editing",
    listing_type: "hourly",
    currency_code: "SAR",
    thumbnail: "/seed-images/digital-products/1517694712202-14dd9538aa97.jpg",
    metadata: {
      thumbnail: "/seed-images/digital-products/1517694712202-14dd9538aa97.jpg",
      images: ["/seed-images/digital-products/1517694712202-14dd9538aa97.jpg"],
      price: 7500,
      rating: 5.0,
    },
    delivery_time_days: 10,
    revisions_included: 2,
    status: "active",
    reviews: [
      {
        rating: 5,
        author: "Salim H.",
        comment:
          "Mind-blowing motion graphics. Our YouTube channel grew rapidly!",
        created_at: "2024-06-15T00:00:00Z",
      },
      {
        rating: 5,
        author: "Huda J.",
        comment:
          "The editing quality was cinematic. Absolutely worth every riyal.",
        created_at: "2024-06-10T00:00:00Z",
      },
      {
        rating: 5,
        author: "Faisal A.",
        comment: "Professional VFX work that transformed our marketing videos.",
        created_at: "2024-06-05T00:00:00Z",
      },
      {
        rating: 4,
        author: "Mona R.",
        comment: "Creative editor with great attention to detail and timing.",
        created_at: "2024-05-28T00:00:00Z",
      },
      {
        rating: 5,
        author: "Zaid M.",
        comment: "Best video editor I've worked with. Highly recommended!",
        created_at: "2024-05-20T00:00:00Z",
      },
    ],
    packages: [
      {
        name: "Basic",
        price: 3000,
        delivery_time: 5,
        description: "Basic video edit",
        features: [
          "Up to 5 min video",
          "Color correction",
          "Background music",
          "1 revision",
        ],
      },
      {
        name: "Standard",
        price: 7500,
        delivery_time: 10,
        description: "Professional edit",
        features: [
          "Up to 15 min video",
          "Motion graphics",
          "Sound design",
          "2 revisions",
          "Thumbnail design",
        ],
      },
      {
        name: "Premium",
        price: 15000,
        delivery_time: 21,
        description: "Full production",
        features: [
          "Up to 30 min video",
          "Advanced VFX",
          "Custom animations",
          "3 revisions",
          "Multiple formats",
          "Social media cuts",
        ],
      },
    ],
    tiers: [
      {
        name: "Basic",
        price: 3000,
        delivery_days: 5,
        description: "Basic video edit up to 5 minutes with color correction",
      },
      {
        name: "Standard",
        price: 7500,
        delivery_days: 10,
        description: "Professional edit with motion graphics and sound design",
      },
      {
        name: "Premium",
        price: 15000,
        delivery_days: 21,
        description: "Full production with advanced VFX and custom animations",
      },
    ],
  },
  {
    id: "free-seed-005",
    title: "Digital Marketing & Social Media Strategy",
    description:
      "Comprehensive digital marketing strategy including social media management, PPC campaigns, and analytics reporting.",
    category: "marketing",
    subcategory: "social_media",
    listing_type: "milestone",
    currency_code: "SAR",
    thumbnail: "/seed-images/content/1460925895917-afdab827c52f.jpg",
    metadata: {
      thumbnail: "/seed-images/content/1460925895917-afdab827c52f.jpg",
      images: ["/seed-images/content/1460925895917-afdab827c52f.jpg"],
      price: 4000,
      rating: 4.6,
    },
    delivery_time_days: 30,
    revisions_included: 4,
    status: "active",
    reviews: [
      {
        rating: 5,
        author: "Noura B.",
        comment:
          "Our social media presence transformed completely. Amazing results!",
        created_at: "2024-05-15T00:00:00Z",
      },
      {
        rating: 4,
        author: "Badr S.",
        comment:
          "Solid strategy and consistent execution. Good ROI on ad spend.",
        created_at: "2024-05-10T00:00:00Z",
      },
      {
        rating: 5,
        author: "Lina T.",
        comment:
          "The analytics reports are incredibly detailed and actionable.",
        created_at: "2024-04-28T00:00:00Z",
      },
      {
        rating: 4,
        author: "Waleed K.",
        comment: "Great understanding of Saudi market trends and audience.",
        created_at: "2024-04-20T00:00:00Z",
      },
      {
        rating: 5,
        author: "Aisha Y.",
        comment: "Doubled our engagement in the first month. Exceptional work!",
        created_at: "2024-04-15T00:00:00Z",
      },
    ],
    packages: [
      {
        name: "Basic",
        price: 2000,
        delivery_time: 14,
        description: "Social media setup",
        features: [
          "Platform audit",
          "Profile optimization",
          "Content calendar",
          "1 revision",
        ],
      },
      {
        name: "Standard",
        price: 4000,
        delivery_time: 30,
        description: "Monthly management",
        features: [
          "3 platforms managed",
          "12 posts/month",
          "Analytics report",
          "Ad campaign setup",
          "2 revisions",
        ],
      },
      {
        name: "Premium",
        price: 8000,
        delivery_time: 30,
        description: "Full digital strategy",
        features: [
          "5 platforms managed",
          "20 posts/month",
          "PPC campaigns",
          "SEO strategy",
          "Monthly reporting",
          "4 revisions",
        ],
      },
    ],
    tiers: [
      {
        name: "Basic",
        price: 2000,
        delivery_days: 14,
        description:
          "Social media setup with platform audit and content calendar",
      },
      {
        name: "Standard",
        price: 4000,
        delivery_days: 30,
        description:
          "Monthly management of 3 platforms with analytics reporting",
      },
      {
        name: "Premium",
        price: 8000,
        delivery_days: 30,
        description: "Full digital strategy with PPC campaigns and SEO",
      },
    ],
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("freelance") as unknown as any;
    const { id } = req.params;
    const item = await mod.retrieveGigListing(id);
    if (item) return res.json({ item: enrichDetailItem(item, "freelance") });
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
    return res.json({ item: seedItem });
  } catch (error: unknown) {
    const { id } = req.params;
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0];
    return res.json({ item: seedItem });
  }
}
