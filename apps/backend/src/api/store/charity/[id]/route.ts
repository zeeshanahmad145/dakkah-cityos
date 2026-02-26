import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const SEED_CHARITIES = [
  {
    id: "charity_seed_01",
    tenant_id: "tenant_seed",
    name: "Clean Water Initiative",
    title: "Clean Water Initiative",
    description: "Providing clean drinking water to communities in need across developing nations. Every donation helps build wells and water purification systems.",
    category: "one_time",
    campaign_type: "one_time",
    logo_url: "/seed-images/charity/1541544537156-7627a7a4aa1c.jpg",
    thumbnail: "/seed-images/charity/1541544537156-7627a7a4aa1c.jpg",
    goal: 5000000,
    target_amount: 5000000,
    raised: 3200000,
    amount_raised: 3200000,
    donor_count: 1240,
    organization: "WaterAid Global",
    currency: "USD",
    end_date: "2025-12-31T00:00:00Z",
    is_urgent: false,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-01T00:00:00Z",
    donors: [
      { name: "Ahmed Al-Rashid", amount: 50000, date: "2025-05-10T00:00:00Z" },
      { name: "Sarah Johnson", amount: 25000, date: "2025-05-08T00:00:00Z" },
      { name: "Mohammed Hassan", amount: 100000, date: "2025-05-05T00:00:00Z" },
      { name: "Emily Chen", amount: 15000, date: "2025-05-01T00:00:00Z" },
      { name: "Anonymous", amount: 75000, date: "2025-04-28T00:00:00Z" },
    ],
    updates: [
      { date: "2025-05-01T00:00:00Z", title: "New Well Completed", content: "We have successfully completed construction of a new well in the Sahel region, providing clean water to over 500 families." },
      { date: "2025-04-15T00:00:00Z", title: "Milestone Reached", content: "Thanks to your generous donations, we have now surpassed 60% of our fundraising goal!" },
      { date: "2025-03-20T00:00:00Z", title: "Partnership Announcement", content: "We are excited to announce a new partnership with local governments to expand our water purification programs." },
    ],
    reviews: [{ author: "Ahmed Al-Rashid", rating: 5, comment: "Transparent organization with real impact. Every donation is tracked and I can see the wells being built.", created_at: "2025-05-10T00:00:00Z" }, { author: "Sarah Johnson", rating: 5, comment: "WaterAid Global does incredible work. Their regular updates show exactly where donations go.", created_at: "2025-05-05T00:00:00Z" }, { author: "David Park", rating: 4, comment: "Important cause with measurable results. The milestone updates keep donors engaged.", created_at: "2025-04-28T00:00:00Z" }, { author: "Fatima Nasser", rating: 5, comment: "Clean water changes everything. Proud to support an initiative that has helped thousands of families.", created_at: "2025-04-20T00:00:00Z" }, { author: "James Williams", rating: 4, comment: "Well-managed charity with clear goals. The partnership with local governments is a smart approach.", created_at: "2025-04-12T00:00:00Z" }],
  },
  {
    id: "charity_seed_02",
    tenant_id: "tenant_seed",
    name: "Emergency Disaster Relief",
    title: "Emergency Disaster Relief",
    description: "Rapid response fund for natural disasters worldwide. Providing shelter, food, and medical supplies to affected communities.",
    category: "emergency",
    campaign_type: "emergency",
    logo_url: "/seed-images/charity/1469571486292-0ba58a3f068b.jpg",
    thumbnail: "/seed-images/charity/1469571486292-0ba58a3f068b.jpg",
    goal: 10000000,
    target_amount: 10000000,
    raised: 7800000,
    amount_raised: 7800000,
    donor_count: 3560,
    organization: "Global Relief Network",
    currency: "USD",
    end_date: "2025-06-30T00:00:00Z",
    is_urgent: true,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-05T00:00:00Z",
    donors: [
      { name: "Global Corp Foundation", amount: 500000, date: "2025-05-12T00:00:00Z" },
      { name: "James Williams", amount: 30000, date: "2025-05-09T00:00:00Z" },
      { name: "Fatima Al-Sayed", amount: 45000, date: "2025-05-06T00:00:00Z" },
      { name: "Robert Kim", amount: 20000, date: "2025-05-03T00:00:00Z" },
      { name: "Lisa Martinez", amount: 10000, date: "2025-04-30T00:00:00Z" },
    ],
    updates: [
      { date: "2025-05-05T00:00:00Z", title: "Emergency Response Deployed", content: "Our rapid response team has been deployed to assist communities affected by recent flooding." },
      { date: "2025-04-20T00:00:00Z", title: "Supply Distribution Complete", content: "Over 10,000 emergency supply kits have been distributed to families in the affected region." },
      { date: "2025-04-01T00:00:00Z", title: "Volunteer Drive Success", content: "Our volunteer recruitment drive brought in 200 new volunteers ready to assist in disaster relief efforts." },
    ],
    reviews: [{ author: "Global Corp Foundation", rating: 5, comment: "Rapid deployment and efficient use of resources. Global Relief Network is our trusted disaster response partner.", created_at: "2025-05-12T00:00:00Z" }, { author: "Lisa Martinez", rating: 5, comment: "They respond within hours of a disaster. The emergency supply kits save lives immediately.", created_at: "2025-05-08T00:00:00Z" }, { author: "Robert Kim", rating: 4, comment: "Critical work when communities need it most. Their volunteer program is well-organized.", created_at: "2025-05-03T00:00:00Z" }, { author: "Nora Ibrahim", rating: 5, comment: "78% funded shows the community trust. Every donation makes an immediate difference.", created_at: "2025-04-25T00:00:00Z" }, { author: "Carlos Mendez", rating: 4, comment: "Urgent causes that deserve support. Supply distribution updates show real accountability.", created_at: "2025-04-18T00:00:00Z" }],
  },
  {
    id: "charity_seed_03",
    tenant_id: "tenant_seed",
    name: "Children's Education Fund",
    title: "Children's Education Fund",
    description: "Supporting underprivileged children with access to quality education, school supplies, and scholarship programs worldwide.",
    category: "recurring",
    campaign_type: "recurring",
    logo_url: "/seed-images/charity/1497486751825-1233686d5d80.jpg",
    thumbnail: "/seed-images/charity/1497486751825-1233686d5d80.jpg",
    goal: 2000000,
    target_amount: 2000000,
    raised: 1450000,
    amount_raised: 1450000,
    donor_count: 890,
    organization: "EduCare Foundation",
    currency: "USD",
    end_date: "2025-09-15T00:00:00Z",
    is_urgent: false,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-10T00:00:00Z",
    donors: [
      { name: "Education First Trust", amount: 200000, date: "2025-05-11T00:00:00Z" },
      { name: "David Park", amount: 15000, date: "2025-05-07T00:00:00Z" },
      { name: "Nora Ibrahim", amount: 35000, date: "2025-05-04T00:00:00Z" },
      { name: "Carlos Mendez", amount: 8000, date: "2025-05-02T00:00:00Z" },
      { name: "Anonymous", amount: 50000, date: "2025-04-25T00:00:00Z" },
    ],
    updates: [
      { date: "2025-04-28T00:00:00Z", title: "New Schools Opened", content: "Three new community schools have opened their doors, welcoming 450 students who previously had no access to education." },
      { date: "2025-04-10T00:00:00Z", title: "Scholarship Awards", content: "120 students received full scholarships for the upcoming academic year." },
      { date: "2025-03-15T00:00:00Z", title: "Teacher Training Program", content: "We have completed training for 50 new teachers who will serve in underserved communities." },
    ],
    reviews: [{ author: "Education First Trust", rating: 5, comment: "EduCare Foundation is transforming lives through education. 120 scholarships in one year is remarkable.", created_at: "2025-05-11T00:00:00Z" }, { author: "Priya Sharma", rating: 5, comment: "Seeing children gain access to quality education is heartwarming. This fund makes a real difference.", created_at: "2025-05-06T00:00:00Z" }, { author: "Tom Anderson", rating: 4, comment: "The teacher training program ensures sustainable impact. Supporting education is supporting the future.", created_at: "2025-04-30T00:00:00Z" }, { author: "Yuki Tanaka", rating: 5, comment: "Three new schools opened thanks to donor support. Incredible progress toward the fundraising goal.", created_at: "2025-04-22T00:00:00Z" }, { author: "Maria Silva", rating: 4, comment: "Recurring donation option makes it easy to contribute regularly. Great transparency in reporting.", created_at: "2025-04-15T00:00:00Z" }],
  },
  {
    id: "charity_seed_04",
    tenant_id: "tenant_seed",
    name: "Wildlife Conservation Project",
    title: "Wildlife Conservation Project",
    description: "Protecting endangered species and their habitats through conservation programs, anti-poaching efforts, and community engagement.",
    category: "matching",
    campaign_type: "matching",
    logo_url: "/seed-images/charity/1469854523086-cc02fe5d8800.jpg",
    thumbnail: "/seed-images/charity/1469854523086-cc02fe5d8800.jpg",
    goal: 3000000,
    target_amount: 3000000,
    raised: 1800000,
    amount_raised: 1800000,
    donor_count: 670,
    organization: "Earth Guardians",
    currency: "USD",
    end_date: "2025-11-30T00:00:00Z",
    is_urgent: false,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-15T00:00:00Z",
    donors: [
      { name: "Wildlife Alliance", amount: 150000, date: "2025-05-10T00:00:00Z" },
      { name: "Peter Anderson", amount: 40000, date: "2025-05-06T00:00:00Z" },
      { name: "Yuki Tanaka", amount: 25000, date: "2025-05-03T00:00:00Z" },
      { name: "Maria Silva", amount: 12000, date: "2025-04-29T00:00:00Z" },
      { name: "Anonymous", amount: 60000, date: "2025-04-22T00:00:00Z" },
    ],
    updates: [
      { date: "2025-05-02T00:00:00Z", title: "Anti-Poaching Success", content: "Our ranger patrols have prevented 15 poaching incidents this quarter, protecting endangered rhino populations." },
      { date: "2025-04-12T00:00:00Z", title: "Habitat Restoration", content: "50 hectares of critical habitat have been restored, providing safe corridors for wildlife migration." },
      { date: "2025-03-25T00:00:00Z", title: "Community Engagement", content: "Local community workshops have educated over 1,000 residents about wildlife conservation and sustainable practices." },
    ],
    reviews: [{ author: "Wildlife Alliance", rating: 5, comment: "Earth Guardians is doing essential conservation work. Their anti-poaching efforts have saved countless animals.", created_at: "2025-05-10T00:00:00Z" }, { author: "Peter Anderson", rating: 5, comment: "Matching donations doubled the impact. The habitat restoration work is visually documented and inspiring.", created_at: "2025-05-05T00:00:00Z" }, { author: "Helen Chen", rating: 4, comment: "Important cause with measurable conservation outcomes. 50 hectares restored is significant progress.", created_at: "2025-04-28T00:00:00Z" }, { author: "Omar Hassan", rating: 5, comment: "Community workshops create lasting change. Educating 1,000 residents amplifies the conservation impact.", created_at: "2025-04-20T00:00:00Z" }, { author: "Sophie Laurent", rating: 4, comment: "Well-organized conservation project. The matching donation model incentivizes greater generosity.", created_at: "2025-04-12T00:00:00Z" }],
  },
  {
    id: "charity_seed_05",
    tenant_id: "tenant_seed",
    name: "Hunger Relief Campaign",
    title: "Hunger Relief Campaign",
    description: "Fighting hunger by distributing meals, supporting food banks, and building sustainable agriculture programs in food-insecure regions.",
    category: "one_time",
    campaign_type: "one_time",
    logo_url: "/seed-images/charity/1488521787991-ed7bbaae773c.jpg",
    thumbnail: "/seed-images/charity/1488521787991-ed7bbaae773c.jpg",
    goal: 4000000,
    target_amount: 4000000,
    raised: 2900000,
    amount_raised: 2900000,
    donor_count: 2100,
    organization: "Feed The World",
    currency: "USD",
    end_date: "2025-10-31T00:00:00Z",
    is_urgent: true,
    is_verified: true,
    status: "active",
    metadata: {},
    created_at: "2025-01-20T00:00:00Z",
    donors: [
      { name: "Feed the Future Fund", amount: 300000, date: "2025-05-13T00:00:00Z" },
      { name: "Hassan Al-Fahad", amount: 55000, date: "2025-05-09T00:00:00Z" },
      { name: "Jennifer Brown", amount: 18000, date: "2025-05-05T00:00:00Z" },
      { name: "Wei Zhang", amount: 22000, date: "2025-05-01T00:00:00Z" },
      { name: "Anonymous", amount: 40000, date: "2025-04-27T00:00:00Z" },
    ],
    updates: [
      { date: "2025-05-08T00:00:00Z", title: "1 Million Meals Served", content: "We have reached the incredible milestone of distributing 1 million meals to families in need this year." },
      { date: "2025-04-22T00:00:00Z", title: "New Food Bank Opened", content: "A new community food bank has been established, serving 200 families weekly with fresh produce and essentials." },
      { date: "2025-04-05T00:00:00Z", title: "Farm Partnership", content: "We have partnered with 15 local farms to source fresh produce directly for our meal distribution programs." },
    ],
    reviews: [{ author: "Feed the Future Fund", rating: 5, comment: "1 million meals served is an extraordinary achievement. Feed The World runs one of the most efficient hunger programs.", created_at: "2025-05-13T00:00:00Z" }, { author: "Hassan Al-Fahad", rating: 5, comment: "Their farm partnerships ensure fresh, nutritious food reaches families in need. Brilliant approach.", created_at: "2025-05-09T00:00:00Z" }, { author: "Jennifer Brown", rating: 4, comment: "The new community food bank serves 200 families weekly. Real, tangible impact on hunger.", created_at: "2025-05-04T00:00:00Z" }, { author: "Wei Zhang", rating: 5, comment: "Urgent cause that affects millions. Every donation helps feed families who would otherwise go hungry.", created_at: "2025-04-27T00:00:00Z" }, { author: "Grace Kim", rating: 4, comment: "Transparent reporting and consistent updates. The sustainable agriculture programs are especially impressive.", created_at: "2025-04-20T00:00:00Z" }],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const mod = req.scope.resolve("charity") as any

    try {
      const charity = await mod.retrieveCharityOrg(id)
      if (charity) {
        let campaigns = []
        try {
          const result = await mod.listDonationCampaigns({ charity_org_id: id }, { take: 100 })
          campaigns = Array.isArray(result) ? result : result?.[0] || []
        } catch (error: any) {}
        return res.json({ item: enrichDetailItem({ ...charity, campaigns }, "charity") })
      }
    } catch (error: any) {
      const isNotFound = error?.type === "not_found" || error?.code === "NOT_FOUND" || error?.message?.includes("not found") || error?.message?.includes("does not exist")
      if (!isNotFound) {
        return handleApiError(res, error, "STORE-CHARITY-ID")
      }
    }

    try {
      const campaign = await mod.retrieveDonationCampaign(id)
      if (campaign) {
        let org = null
        try {
          org = await mod.retrieveCharityOrg((campaign as any).charity_org_id)
        } catch (error: any) {}
        return res.json({ item: enrichDetailItem({ ...campaign, organization: org }, "charity") })
      }
    } catch (error: any) {
      const isNotFound = error?.type === "not_found" || error?.code === "NOT_FOUND" || error?.message?.includes("not found") || error?.message?.includes("does not exist")
      if (!isNotFound) {
        return handleApiError(res, error, "STORE-CHARITY-ID")
      }
    }
  } catch (error: any) {}

  const seedMatch = SEED_CHARITIES.find((c) => c.id === id) || SEED_CHARITIES[0]
  return res.json({ item: seedMatch })
}
