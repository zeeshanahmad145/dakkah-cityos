import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "groc-seed-001",
    product_id: "groc-seed-001",
    thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg",
    metadata: {
      name: "Organic Fresh Strawberries",
      description: "Hand-picked organic strawberries from local farms. Sweet, juicy, and perfect for smoothies or snacking.",
      thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg",
      images: ["/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg"],
      price: 1299,
      currency: "SAR",
      category: "fruits",
    },
    organic: true,
    unit_type: "kg",
    storage_type: "refrigerated",
    shelf_life_days: 5,
    nutrition: { calories: "32 per 100g", protein: "0.7g", carbohydrates: "7.7g", fiber: "2g", sugar: "4.9g", fat: "0.3g", vitamin_c: "58.8mg" },
    nutrition_facts: [{ label: "Calories", value: "32 per 100g" }, { label: "Protein", value: "0.7g" }, { label: "Carbs", value: "7.7g" }, { label: "Fat", value: "0.3g" }],
    allergens: [],
    related_products: [
      { id: "groc-seed-005", name: "Organic Mixed Vegetables Box", price: 2499, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-003", name: "Farm Fresh Free-Range Eggs", price: 1599, thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg" },
      { id: "groc-seed-002", name: "Artisan Sourdough Bread", price: 899, thumbnail: "/seed-images/bundles%2F1504674900247-0877df9cc836.jpg" },
    ],
    dietary: ["Vegan", "Gluten-Free", "Keto-Friendly", "Paleo"],
    reviews: [
      { author: "Nora A.", rating: 5, comment: "The freshest strawberries I've ever ordered online. Sweet, plump, and perfect for my morning smoothies.", created_at: "2025-04-10T08:00:00Z" },
      { author: "Khalid M.", rating: 5, comment: "My kids love these organic strawberries. You can taste the difference from conventional ones. Great quality.", created_at: "2025-03-28T10:30:00Z" },
      { author: "Susan T.", rating: 4, comment: "Consistently good quality. Occasionally a few bruised ones but overall excellent for the price.", created_at: "2025-03-15T14:00:00Z" },
      { author: "Omar B.", rating: 5, comment: "Love that these are locally sourced and organic. The flavor is incredible — like picking them fresh from the garden.", created_at: "2025-02-20T09:00:00Z" },
      { author: "Linda P.", rating: 4, comment: "Perfect for baking and snacking. They arrive well-packaged and stay fresh for several days.", created_at: "2025-02-05T11:30:00Z" },
    ],
  },
  {
    id: "groc-seed-002",
    product_id: "groc-seed-002",
    thumbnail: "/seed-images/grocery%2F1464965911861-746a04b4bca6.jpg",
    metadata: {
      name: "Artisan Sourdough Bread",
      description: "Freshly baked sourdough bread made with traditional fermentation methods. Crispy crust, soft interior.",
      thumbnail: "/seed-images/bundles%2F1504674900247-0877df9cc836.jpg",
      images: ["/seed-images/bundles%2F1504674900247-0877df9cc836.jpg"],
      price: 899,
      currency: "SAR",
      category: "bakery",
    },
    organic: false,
    unit_type: "loaf",
    storage_type: "ambient",
    shelf_life_days: 3,
    nutrition: { calories: "259 per 100g", protein: "8.5g", carbohydrates: "51g", fiber: "2.7g", sugar: "3.5g", fat: "1.2g", sodium: "500mg" },
    nutrition_facts: [{ label: "Calories", value: "259 per 100g" }, { label: "Protein", value: "8.5g" }, { label: "Carbs", value: "51g" }, { label: "Fat", value: "1.2g" }],
    allergens: ["Wheat", "Gluten"],
    related_products: [
      { id: "groc-seed-001", name: "Organic Fresh Strawberries", price: 1299, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-003", name: "Farm Fresh Free-Range Eggs", price: 1599, thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg" },
      { id: "groc-seed-004", name: "Premium Wagyu Beef Steaks", price: 12999, thumbnail: "/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg" },
    ],
    dietary: ["Vegetarian", "Vegan", "Dairy-Free"],
    reviews: [
      { author: "Marco R.", rating: 5, comment: "The best sourdough I've found for delivery. Crispy crust and the tangy flavor is just right.", created_at: "2025-04-08T07:30:00Z" },
      { author: "Emily C.", rating: 5, comment: "You can tell this is made with traditional methods. Reminds me of bakery bread in Europe.", created_at: "2025-03-25T09:00:00Z" },
      { author: "Ahmed S.", rating: 4, comment: "Great texture and taste. Best consumed within 2 days for optimal freshness. We order weekly.", created_at: "2025-03-10T12:00:00Z" },
      { author: "Helen W.", rating: 4, comment: "Perfect for toast and sandwiches. The fermentation gives it such a wonderful depth of flavor.", created_at: "2025-02-22T08:15:00Z" },
      { author: "James D.", rating: 5, comment: "Finally a sourdough that lives up to its name. Dense, chewy, with a beautiful crust. Outstanding.", created_at: "2025-02-08T10:00:00Z" },
    ],
  },
  {
    id: "groc-seed-003",
    product_id: "groc-seed-003",
    thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg",
    metadata: {
      name: "Farm Fresh Free-Range Eggs",
      description: "Premium free-range eggs from pasture-raised hens. Rich in omega-3 and packed with flavor.",
      thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg",
      images: ["/seed-images/grocery%2F1548848221-0c2e497ed557.jpg"],
      price: 1599,
      currency: "SAR",
      category: "dairy",
    },
    organic: true,
    unit_type: "dozen",
    storage_type: "refrigerated",
    shelf_life_days: 21,
    nutrition: { calories: "155 per 2 eggs", protein: "13g", carbohydrates: "1.1g", fiber: "0g", sugar: "1.1g", fat: "11g", cholesterol: "373mg" },
    nutrition_facts: [{ label: "Calories", value: "155 per 2 eggs" }, { label: "Protein", value: "13g" }, { label: "Carbs", value: "1.1g" }, { label: "Fat", value: "11g" }],
    allergens: ["Eggs"],
    related_products: [
      { id: "groc-seed-001", name: "Organic Fresh Strawberries", price: 1299, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-002", name: "Artisan Sourdough Bread", price: 899, thumbnail: "/seed-images/bundles%2F1504674900247-0877df9cc836.jpg" },
      { id: "groc-seed-005", name: "Organic Mixed Vegetables Box", price: 2499, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
    ],
    dietary: ["Gluten-Free", "Keto-Friendly", "Paleo", "Vegetarian"],
    reviews: [
      { author: "Patricia L.", rating: 5, comment: "The yolks are so rich and orange — you can tell these hens are truly free-range. Best eggs available.", created_at: "2025-04-06T08:00:00Z" },
      { author: "Tom K.", rating: 5, comment: "Once you try real free-range eggs, you can never go back. The flavor difference is remarkable.", created_at: "2025-03-22T09:30:00Z" },
      { author: "Maryam A.", rating: 4, comment: "Excellent quality eggs. Occasionally one or two have minor shell cracks but the taste is always superb.", created_at: "2025-03-08T07:00:00Z" },
      { author: "Robert S.", rating: 5, comment: "Worth the premium price. My omelets and baked goods have never tasted better. Consistently fresh.", created_at: "2025-02-20T10:00:00Z" },
      { author: "Grace N.", rating: 4, comment: "Happy to support ethical farming. These eggs are packed with nutrition and the omega-3 content is a bonus.", created_at: "2025-02-05T08:45:00Z" },
    ],
  },
  {
    id: "groc-seed-004",
    product_id: "groc-seed-004",
    thumbnail: "/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg",
    metadata: {
      name: "Premium Wagyu Beef Steaks",
      description: "A5 grade Wagyu beef steaks with exceptional marbling. Perfect for grilling or pan-searing.",
      thumbnail: "/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg",
      images: ["/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg"],
      price: 12999,
      currency: "SAR",
      category: "meat",
    },
    organic: false,
    unit_type: "kg",
    storage_type: "frozen",
    shelf_life_days: 90,
    nutrition: { calories: "250 per 100g", protein: "17g", carbohydrates: "0g", fiber: "0g", sugar: "0g", fat: "20g", iron: "2.6mg" },
    nutrition_facts: [{ label: "Calories", value: "250 per 100g" }, { label: "Protein", value: "17g" }, { label: "Carbs", value: "0g" }, { label: "Fat", value: "20g" }],
    allergens: ["Soy"],
    related_products: [
      { id: "groc-seed-003", name: "Farm Fresh Free-Range Eggs", price: 1599, thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg" },
      { id: "groc-seed-001", name: "Organic Fresh Strawberries", price: 1299, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-005", name: "Organic Mixed Vegetables Box", price: 2499, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
    ],
    dietary: ["Gluten-Free", "Keto-Friendly", "Paleo", "Low-Carb"],
    reviews: [
      { author: "Chef Andre", rating: 5, comment: "Authentic A5 Wagyu with incredible marbling. Melts in your mouth. Restaurant quality delivered to my door.", created_at: "2025-04-09T18:00:00Z" },
      { author: "Michael H.", rating: 5, comment: "Splurged on these for our anniversary dinner and it was worth every riyal. The best steak I've ever cooked at home.", created_at: "2025-03-26T19:30:00Z" },
      { author: "Yuki T.", rating: 5, comment: "As a Japanese expat, I'm impressed with the quality. The marbling score is genuine A5 grade. Excellent.", created_at: "2025-03-12T17:00:00Z" },
      { author: "Sandra B.", rating: 4, comment: "Premium product at a premium price. The flavor is unmatched. Just be careful not to overcook — medium rare is perfect.", created_at: "2025-02-25T20:00:00Z" },
      { author: "David C.", rating: 5, comment: "Arrived frozen and well-packaged. The steaks thawed beautifully and cooked to perfection. A true luxury.", created_at: "2025-02-10T18:30:00Z" },
    ],
  },
  {
    id: "groc-seed-005",
    product_id: "groc-seed-005",
    thumbnail: "/seed-images/grocery%2F1540420773420-3366772f4999.jpg",
    metadata: {
      name: "Organic Mixed Vegetables Box",
      description: "A curated box of seasonal organic vegetables including tomatoes, peppers, zucchini, and leafy greens.",
      thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg",
      images: ["/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg"],
      price: 2499,
      currency: "SAR",
      category: "vegetables",
    },
    organic: true,
    unit_type: "box",
    storage_type: "refrigerated",
    shelf_life_days: 7,
    nutrition: { calories: "25 per 100g", protein: "1.5g", carbohydrates: "5g", fiber: "2.5g", sugar: "3g", fat: "0.2g", vitamin_a: "42% DV" },
    nutrition_facts: [{ label: "Calories", value: "25 per 100g" }, { label: "Protein", value: "1.5g" }, { label: "Carbs", value: "5g" }, { label: "Fat", value: "0.2g" }],
    allergens: ["Celery", "Mustard"],
    related_products: [
      { id: "groc-seed-001", name: "Organic Fresh Strawberries", price: 1299, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-004", name: "Premium Wagyu Beef Steaks", price: 12999, thumbnail: "/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg" },
      { id: "groc-seed-003", name: "Farm Fresh Free-Range Eggs", price: 1599, thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg" },
    ],
    dietary: ["Vegan", "Gluten-Free", "Keto-Friendly", "Paleo", "Whole30"],
    reviews: [
      { author: "Elena V.", rating: 5, comment: "The seasonal selection is always surprising and fresh. Love getting different vegetables each week.", created_at: "2025-04-07T10:00:00Z" },
      { author: "Rashid K.", rating: 4, comment: "Great variety and everything is genuinely organic. The leafy greens are especially crisp and flavorful.", created_at: "2025-03-24T09:00:00Z" },
      { author: "Jenny L.", rating: 5, comment: "This box has changed how we eat. We plan our meals around what arrives and waste almost nothing.", created_at: "2025-03-10T11:30:00Z" },
      { author: "Hassan F.", rating: 4, comment: "Good value for the quantity and quality. The tomatoes and peppers are particularly outstanding.", created_at: "2025-02-22T08:00:00Z" },
      { author: "Marie D.", rating: 5, comment: "Supporting local organic farmers while getting the freshest produce. The zucchini and greens are my favorites.", created_at: "2025-02-08T10:15:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("grocery") as any
    const { id } = req.params
    const item = await mod.retrieveFreshProduct(id)
    if (item) return res.json({ item })
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
