import { MedusaService } from "@medusajs/framework/utils";
import Quote from "./models/quote";
import QuoteItem from "./models/quote-item";

/**
 * Quote Service
 *
 * Manages B2B quotes and RFQ workflow.
 */
class QuoteModuleService extends MedusaService({
  Quote,
  QuoteItem,
}) {
  /**
   * Generate next quote number
   */
  async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const quotes = (await this.listQuotes({
      quote_number: { $like: `Q-${year}-%` },
    })) as unknown as unknown[];
    const count = Array.isArray(quotes) ? quotes.length : 0;
    const nextNum = count + 1;
    return `Q-${year}-${nextNum.toString().padStart(4, "0")}`;
  }

  /**
   * Calculate quote totals
   */
  async calculateQuoteTotals(quoteId: string): Promise<void> {
    const items = (await this.listQuoteItems({
      quote_id: quoteId,
    })) as unknown as Array<Record<string, unknown>>;
    let subtotal = 0n;
    let discountTotal = 0n;
    let taxTotal = 0n;
    let total = 0n;
    const itemsArray = Array.isArray(items)
      ? items
      : [items as Record<string, unknown>].filter(Boolean);
    for (const item of itemsArray) {
      const unitPrice = item.custom_unit_price ?? item.unit_price;
      const itemPrice = BigInt(String(unitPrice));
      const itemSubtotal = itemPrice * BigInt(String(item.quantity));
      const itemDiscount = BigInt(String(item.discount_total || 0));
      const itemTax = BigInt(String(item.tax_total || 0));
      const itemTotal = itemSubtotal - itemDiscount + itemTax;
      await this.updateQuoteItems({
        id: item.id as string,
        subtotal: itemSubtotal.toString(),
        total: itemTotal.toString(),
      } as unknown as any);
      subtotal += itemSubtotal;
      discountTotal += itemDiscount;
      taxTotal += itemTax;
      total += itemTotal;
    }
    await this.updateQuotes({
      id: quoteId,
      subtotal: subtotal.toString(),
      discount_total: discountTotal.toString(),
      tax_total: taxTotal.toString(),
      total: total.toString(),
    } as unknown as any);
  }

  /**
   * Check if quote is valid (not expired)
   */
  async isQuoteValid(quoteId: string): Promise<boolean> {
    const quote = (await this.retrieveQuote(quoteId)) as unknown as Record<
      string,
      unknown
    >;
    if (!quote.valid_until) return true;
    return new Date() <= new Date(String(quote.valid_until));
  }

  /**
   * Apply custom discount to quote
   */
  async applyCustomDiscount(
    quoteId: string,
    discountType: "percentage" | "fixed",
    discountValue: number,
    reason?: string,
  ): Promise<void> {
    const quote = (await this.retrieveQuote(quoteId)) as unknown as Record<
      string,
      unknown
    >;

    let discountAmount: bigint;

    if (discountType === "percentage") {
      discountAmount =
        (BigInt(String(quote.subtotal)) *
          BigInt(Math.floor(discountValue * 100))) /
        10000n;
    } else {
      discountAmount = BigInt(discountValue);
    }

    await this.updateQuotes({
      id: quoteId,
      custom_discount_percentage:
        discountType === "percentage" ? discountValue : null,
      custom_discount_amount: discountAmount.toString(),
      discount_reason: reason || null,
      discount_total: discountAmount.toString(),
      total: (
        BigInt(String(quote.subtotal)) -
        discountAmount +
        BigInt(String(quote.tax_total || 0))
      ).toString(),
    } as unknown as any);
  }

  /**
   * Convert quote to cart (for checkout)
   */
  async createCartFromQuote(quoteId: string): Promise<{
    items: Array<{
      variant_id: string;
      quantity: number;
      unit_price: string;
      metadata: Record<string, unknown>;
    }>;
    metadata: Record<string, unknown>;
  }> {
    const quote = (await this.retrieveQuote(quoteId)) as unknown as Record<
      string,
      unknown
    >;
    const items = (await this.listQuoteItems({
      quote_id: quoteId,
    })) as unknown as Array<Record<string, unknown>>;
    const itemsArray = Array.isArray(items)
      ? items
      : [items as Record<string, unknown>].filter(Boolean);
    return {
      items: itemsArray.map((item) => ({
        variant_id: item.variant_id as string,
        quantity: item.quantity as number,
        unit_price: String(item.custom_unit_price ?? item.unit_price),
        metadata: {
          quote_id: quoteId,
          quote_item_id: item.id,
          from_quote: true,
        },
      })),
      metadata: {
        quote_id: quoteId,
        quote_number: quote.quote_number,
      },
    };
  }
}

export default QuoteModuleService;
