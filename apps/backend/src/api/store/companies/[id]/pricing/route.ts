import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../../lib/api-error-handler"

// GET - Get B2B pricing tier for a company
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const { product_id, variant_id } = req.query as {
      product_id?: string
      variant_id?: string
    }

    const query = req.scope.resolve("query") as unknown as any

    // Get company with tier info
    const { data: companies } = await query.graph({
      entity: "company",
      fields: [
        "id",
        "name",
        "pricing_tier_id",
        "pricing_tier.id",
        "pricing_tier.name",
        "pricing_tier.discount_percentage",
        "pricing_tier.price_list_id"
      ],
      filters: { id }
    })

    if (!companies.length) {
      return res.status(404).json({ message: "Company not found" })
    }

    const company = companies[0]

    if (!company.pricing_tier_id) {
      return res.json({
        company_id: id,
        has_b2b_pricing: false,
        tier: null,
        prices: []
      })
    }

    const tier = company.pricing_tier

    // If requesting specific product pricing
    if (product_id || variant_id) {
      // Get B2B prices for the product/variant
      const priceFilters: Record<string, any> = {
        price_list_id: tier.price_list_id
      }
    
      if (variant_id) {
        priceFilters.variant_id = variant_id
      } else if (product_id) {
        // Get all variants for product
        const { data: product } = await query.graph({
          entity: "product",
          fields: ["variants.id"],
          filters: { id: product_id }
        })
      
        if (product.length && product[0].variants) {
          priceFilters.variant_id = { $in: product[0].variants.map((v: any) => v.id) }
        }
      }

      const { data: prices } = await query.graph({
        entity: "price",
        fields: ["id", "variant_id", "amount", "currency_code", "min_quantity"],
        filters: priceFilters
      })

      return res.json({
        company_id: id,
        has_b2b_pricing: true,
        tier: {
          id: tier.id,
          name: tier.name,
          discount_percentage: tier.discount_percentage
        },
        prices: prices.map((p: any) => ({
          variant_id: p.variant_id,
          amount: p.amount,
          currency_code: p.currency_code,
          min_quantity: p.min_quantity || 1
        }))
      })
    }

    // Return just tier info
    res.json({
      company_id: id,
      has_b2b_pricing: true,
      tier: {
        id: tier.id,
        name: tier.name,
        discount_percentage: tier.discount_percentage
      }
    })

  } catch (error: unknown) {
    handleApiError(res, error, "GET store companies id pricing")}
}

