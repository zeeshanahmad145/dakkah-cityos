import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const applyCreditSchema = z.object({
  cart_id: z.string().min(1),
  amount: z.number().positive(),
});

const SEED_CREDIT_PRODUCTS = [
  {
    id: "cr-1",
    name: "Business Platinum Credit Line",
    description:
      "Revolving credit line up to $50,000 for established businesses. Competitive rates and flexible repayment.",
    type: "credit_line",
    credit_limit: 5000000,
    apr: 8.9,
    currency_code: "usd",
    features: [
      "No annual fee",
      "0% intro APR for 6 months",
      "Dedicated account manager",
      "Online portal access",
    ],
    thumbnail: "/seed-images/credit/1563013544-824ae1b704d3.jpg",
    status: "active",
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "cr-2",
    name: "Buy Now, Pay Later",
    description:
      "Split any purchase into 4 interest-free payments. No credit check required for orders under $500.",
    type: "bnpl",
    credit_limit: 50000,
    apr: 0,
    currency_code: "usd",
    features: [
      "4 interest-free installments",
      "No late fees on first miss",
      "Instant approval",
      "Works on all products",
    ],
    thumbnail: "/seed-images/credit/1559526324-4b87b5e36e44.jpg",
    status: "active",
    created_at: "2025-02-01T00:00:00Z",
  },
  {
    id: "cr-3",
    name: "Net-30 Trade Credit",
    description:
      "30-day payment terms for qualified businesses. Build your business credit while managing cash flow.",
    type: "net_terms",
    credit_limit: 2500000,
    apr: 0,
    currency_code: "usd",
    features: [
      "0% interest if paid in 30 days",
      "Auto-pay option",
      "PDF invoicing",
      "Credit reporting",
    ],
    thumbnail: "/seed-images/credit/1559526324-4b87b5e36e44.jpg",
    status: "active",
    created_at: "2025-02-15T00:00:00Z",
  },
  {
    id: "cr-4",
    name: "Store Credit Rewards",
    description:
      "Earn store credit on every purchase. Redeem for future orders with no restrictions.",
    type: "store_credit",
    credit_limit: 0,
    apr: 0,
    currency_code: "usd",
    features: [
      "5% back on every purchase",
      "No expiration",
      "No minimum redemption",
      "Stackable with promotions",
    ],
    thumbnail: "/seed-images/credit/1559526324-4b87b5e36e44.jpg",
    status: "active",
    created_at: "2025-03-01T00:00:00Z",
  },
  {
    id: "cr-5",
    name: "Equipment Financing",
    description:
      "Finance large equipment purchases over 12-60 months. Low monthly payments with flexible terms.",
    type: "financing",
    credit_limit: 10000000,
    apr: 5.9,
    currency_code: "usd",
    features: [
      "Terms up to 60 months",
      "Fixed monthly payments",
      "No prepayment penalty",
      "Tax-deductible interest",
    ],
    thumbnail: "/seed-images/credit/1559526324-4b87b5e36e44.jpg",
    status: "active",
    created_at: "2025-03-15T00:00:00Z",
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id;

  if (!customerId) {
    return res.json({
      credit: {
        limit: 0,
        used: 0,
        available: 0,
        currency: "USD",
      },
      items: SEED_CREDIT_PRODUCTS,
      credit_products: SEED_CREDIT_PRODUCTS,
      count: SEED_CREDIT_PRODUCTS.length,
      public_info: {
        title: "Store Credit & Buy Now, Pay Later",
        description: "Flexible credit options for businesses and individuals.",
        options: [
          {
            name: "Business Credit Line",
            description:
              "Get approved for a revolving credit line for your business purchases",
            requirements: "Business account required",
          },
          {
            name: "Net-30 Terms",
            description: "Pay within 30 days of purchase with no interest",
            requirements: "Approved business account",
          },
          {
            name: "Net-60 Terms",
            description:
              "Extended 60-day payment terms for qualified businesses",
            requirements: "Established business relationship",
          },
        ],
        how_to_apply: [
          "Create or log in to your account",
          "Link your business profile",
          "Submit a credit application",
          "Get approved and start purchasing on credit",
        ],
      },
    });
  }

  const { tenant_id } = req.query as Record<string, string | undefined>;

  try {
    const companyModule = req.scope.resolve("company") as unknown as any;

    const employees = await companyModule.listCompanyUsers({
      customer_id: customerId,
    });

    const employeeList = Array.isArray(employees)
      ? employees
      : [employees].filter(Boolean);

    if (employeeList.length === 0) {
      return res.json({
        credit: {
          limit: 0,
          used: 0,
          available: 0,
          currency: "USD",
        },
      });
    }

    const employee = employeeList[0];
    const company = await companyModule.retrieveCompany(employee.company_id);

    const creditLimit = Number(company.credit_limit || 0);
    const creditUsed = Number(company.credit_used || 0);
    const availableCredit = creditLimit - creditUsed;

    res.json({
      credit: {
        limit: creditLimit,
        used: creditUsed,
        available: availableCredit,
        utilization_percent:
          creditLimit > 0
            ? Math.round((creditUsed / creditLimit) * 10000) / 100
            : 0,
        payment_terms: company.payment_terms,
        currency: "USD",
      },
      company: {
        id: company.id,
        name: company.name,
      },
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-CREDIT");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id;

  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const parsed = applyCreditSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const { cart_id, amount } = parsed.data;

  try {
    const companyModule = req.scope.resolve("company") as unknown as any;

    const employees = await companyModule.listCompanyUsers({
      customer_id: customerId,
    });

    const employeeList = Array.isArray(employees)
      ? employees
      : [employees].filter(Boolean);

    if (employeeList.length === 0) {
      return res.status(404).json({ message: "No company account found" });
    }

    const employee = employeeList[0];
    const company = await companyModule.retrieveCompany(employee.company_id);

    const creditLimit = Number(company.credit_limit || 0);
    const creditUsed = Number(company.credit_used || 0);
    const availableCredit = creditLimit - creditUsed;

    if (amount > availableCredit) {
      return res.status(400).json({ message: "Insufficient credit balance" });
    }

    res.json({
      success: true,
      applied_amount: amount,
      remaining_credit: availableCredit - amount,
      cart_id,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-CREDIT");
  }
}
