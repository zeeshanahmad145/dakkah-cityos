import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  {
    id: "blog-1",
    slug: "the-future-of-e-commerce-in-2026",
    title: "The Future of E-Commerce in 2026",
    excerpt: "Explore the latest trends shaping online retail, from AI-powered personalization to sustainable packaging solutions.",
    content: "<p>The e-commerce landscape is evolving rapidly, driven by advances in artificial intelligence, changing consumer expectations, and a global push toward sustainability.</p><p>In 2026, we're seeing several key trends reshape the industry:</p><h2>AI-Powered Personalization</h2><p>Machine learning algorithms now power highly personalized shopping experiences, from product recommendations to dynamic pricing. Retailers using AI-driven personalization report up to 35% higher conversion rates.</p><h2>Sustainable Packaging</h2><p>Consumers increasingly demand eco-friendly packaging options. Brands that have adopted biodegradable and recyclable packaging materials have seen a 20% boost in customer loyalty.</p><h2>Social Commerce</h2><p>Social media platforms continue to integrate shopping features, making it easier than ever for consumers to discover and purchase products without leaving their favorite apps.</p>",
    category: "tech",
    author: "Sarah Mitchell",
    publishedAt: "2026-02-10T09:00:00Z",
    read_time: "6 min read",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    tags: ["e-commerce", "technology", "trends"],
  },
  {
    id: "blog-2",
    slug: "10-tips-for-building-a-successful-online-store",
    title: "10 Tips for Building a Successful Online Store",
    excerpt: "From product photography to customer retention strategies, learn the essentials of running a thriving e-commerce business.",
    content: "<p>Building a successful online store requires more than just listing products. Here are 10 essential tips to help you thrive in the competitive e-commerce landscape.</p><h2>1. Invest in Professional Photography</h2><p>High-quality product images are your most powerful sales tool. Studies show that 93% of consumers consider visual appearance the key factor in purchasing decisions.</p><h2>2. Optimize for Mobile</h2><p>With over 70% of e-commerce traffic coming from mobile devices, a responsive design isn't optional—it's essential.</p><h2>3. Build Trust with Reviews</h2><p>Customer reviews significantly impact purchasing decisions. Encourage satisfied customers to leave reviews and respond professionally to negative feedback.</p>",
    category: "guides",
    author: "Ahmed Al-Rashid",
    publishedAt: "2026-02-08T14:30:00Z",
    read_time: "8 min read",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    tags: ["guides", "e-commerce", "business"],
  },
  {
    id: "blog-3",
    slug: "smart-city-infrastructure-a-new-era-of-urban-living",
    title: "Smart City Infrastructure: A New Era of Urban Living",
    excerpt: "How IoT sensors, digital twins, and connected platforms are transforming the way cities operate and serve citizens.",
    content: "<p>Smart city technology is revolutionizing urban infrastructure, creating more efficient, sustainable, and livable cities around the world.</p><h2>IoT Sensor Networks</h2><p>Connected sensors monitor everything from air quality to traffic flow, providing real-time data that city planners use to make informed decisions.</p><h2>Digital Twins</h2><p>Virtual replicas of city infrastructure allow planners to simulate changes before implementing them, reducing costs and minimizing disruption.</p><h2>Connected Platforms</h2><p>Integrated platforms like CityOS bring together multiple city services into a single, unified system that improves both efficiency and citizen experience.</p>",
    category: "tech",
    author: "Dr. Fatima Khan",
    publishedAt: "2026-02-05T11:00:00Z",
    read_time: "10 min read",
    thumbnail: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=600&fit=crop",
    tags: ["smart-city", "technology", "infrastructure"],
  },
  {
    id: "blog-4",
    slug: "sustainable-fashion-making-ethical-choices-easy",
    title: "Sustainable Fashion: Making Ethical Choices Easy",
    excerpt: "A guide to building a conscious wardrobe without compromising on style or breaking the bank.",
    content: "<p>Sustainable fashion is no longer a niche movement—it's becoming the standard. Here's how you can make ethical fashion choices without sacrificing style.</p><h2>Understanding Fast Fashion's Impact</h2><p>The fashion industry is one of the world's largest polluters. By choosing sustainable brands, you can help reduce waste, water usage, and carbon emissions.</p><h2>Building a Capsule Wardrobe</h2><p>A capsule wardrobe focuses on versatile, high-quality pieces that can be mixed and matched. This approach reduces waste and saves money in the long run.</p>",
    category: "lifestyle",
    author: "Layla Hassan",
    publishedAt: "2026-02-03T08:00:00Z",
    read_time: "5 min read",
    thumbnail: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop",
    tags: ["fashion", "sustainability", "lifestyle"],
  },
  {
    id: "blog-5",
    slug: "how-small-businesses-can-compete-in-the-digital-marketplace",
    title: "How Small Businesses Can Compete in the Digital Marketplace",
    excerpt: "Practical strategies for small business owners to leverage technology, social media, and marketplace platforms.",
    content: "<p>Small businesses have more tools than ever to compete with larger companies in the digital marketplace.</p><h2>Leverage Social Media</h2><p>Social media platforms offer free and paid tools to reach your target audience. Authentic engagement and storytelling can help small businesses build loyal communities.</p><h2>Use Marketplace Platforms</h2><p>Platforms like CityOS provide small businesses with enterprise-grade tools at affordable prices, leveling the playing field.</p>",
    category: "business",
    author: "Omar Khaled",
    publishedAt: "2026-01-28T16:00:00Z",
    read_time: "7 min read",
    thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
    tags: ["business", "small-business", "digital"],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { slug } = req.params
  const seedItem = SEED_DATA.find(i => i.slug === slug || i.id === slug) || SEED_DATA[0]
  return res.json({ post: seedItem, item: seedItem })
}
