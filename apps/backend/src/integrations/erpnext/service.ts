import axios, { AxiosInstance } from "axios";
import { MedusaError } from "@medusajs/framework/utils";

export interface ERPNextConfig {
  apiKey: string;
  apiSecret: string;
  siteUrl: string;
}

export interface CreateInvoiceData {
  customer_name: string;
  customer_email: string;
  posting_date: Date;
  due_date: Date;
  items: Array<{
    item_code: string;
    item_name: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  taxes?: Array<{
    charge_type: string;
    account_head: string;
    rate: number;
  }>;
  total: number;
  grand_total: number;
  currency: string;
  medusa_order_id?: string;
}

export class ERPNextService {
  private client: AxiosInstance;
  private config: ERPNextConfig;

  constructor(config: ERPNextConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.siteUrl}/api`,
      headers: {
        Authorization: `token ${config.apiKey}:${config.apiSecret}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Create a Sales Invoice in ERPNext
   */
  async createInvoice(data: CreateInvoiceData): Promise<{
    name: string;
    status: string;
  }> {
    try {
      const response = await this.client.post("/resource/Sales Invoice", {
        customer: data.customer_name,
        customer_email: data.customer_email,
        posting_date: this.formatDate(data.posting_date),
        due_date: this.formatDate(data.due_date),
        items: data.items.map((item) => ({
          item_code: item.item_code,
          item_name: item.item_name,
          qty: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        taxes: data.taxes || [],
        currency: data.currency,
        custom_medusa_order_id: data.medusa_order_id,
      });

      return {
        name: response.data.data.name,
        status: response.data.data.status,
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to create invoice: ${error.response?.data?.message || (error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Create or update a Customer in ERPNext
   */
  async syncCustomer(data: {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    customer_type: "Individual" | "Company";
    territory?: string;
    medusa_customer_id?: string;
  }): Promise<{ name: string }> {
    try {
      // Check if customer exists
      const existing = await this.findCustomer(data.customer_email);

      if (existing) {
        // Update existing
        await this.client.put(`/resource/Customer/${existing.name}`, {
          customer_name: data.customer_name,
          mobile_no: data.customer_phone,
          custom_medusa_customer_id: data.medusa_customer_id,
        });

        return { name: existing.name };
      } else {
        // Create new
        const response = await this.client.post("/resource/Customer", {
          customer_name: data.customer_name,
          customer_type: data.customer_type,
          territory: data.territory || "All Territories",
          email_id: data.customer_email,
          mobile_no: data.customer_phone,
          custom_medusa_customer_id: data.medusa_customer_id,
        });

        return { name: response.data.data.name };
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to sync customer: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Create or update an Item in ERPNext
   */
  async syncProduct(data: {
    item_code: string;
    item_name: string;
    item_group: string;
    stock_uom: string;
    standard_rate: number;
    description?: string;
    medusa_product_id?: string;
  }): Promise<{ name: string }> {
    try {
      // Check if item exists
      const existing = await this.findItem(data.item_code);

      if (existing) {
        // Update existing
        await this.client.put(`/resource/Item/${existing.name}`, {
          item_name: data.item_name,
          standard_rate: data.standard_rate,
          description: data.description,
          custom_medusa_product_id: data.medusa_product_id,
        });

        return { name: existing.name };
      } else {
        // Create new
        const response = await this.client.post("/resource/Item", {
          item_code: data.item_code,
          item_name: data.item_name,
          item_group: data.item_group,
          stock_uom: data.stock_uom,
          standard_rate: data.standard_rate,
          description: data.description,
          custom_medusa_product_id: data.medusa_product_id,
        });

        return { name: response.data.data.name };
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to sync product: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Record a Payment Entry
   */
  async recordPayment(data: {
    party_type: "Customer";
    party: string;
    paid_amount: number;
    received_amount: number;
    reference_no?: string;
    reference_date?: Date;
    payment_type: "Receive" | "Pay";
    mode_of_payment?: string;
    medusa_order_id?: string;
  }): Promise<{ name: string }> {
    try {
      const response = await this.client.post("/resource/Payment Entry", {
        payment_type: data.payment_type,
        party_type: data.party_type,
        party: data.party,
        paid_amount: data.paid_amount,
        received_amount: data.received_amount,
        reference_no: data.reference_no,
        reference_date: data.reference_date
          ? this.formatDate(data.reference_date)
          : this.formatDate(new Date()),
        mode_of_payment: data.mode_of_payment || "Cash",
        custom_medusa_order_id: data.medusa_order_id,
      });

      return { name: response.data.data.name };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to record payment: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Get financial reports
   */
  async getAccountsReceivable(filters?: {
    from_date?: Date;
    to_date?: Date;
    customer?: string;
  }): Promise<
    Array<{
      customer: string;
      outstanding_amount: number;
      invoices: number;
    }>
  > {
    try {
      const params: any = {
        report_name: "Accounts Receivable",
      };

      if (filters?.from_date) {
        params.from_date = this.formatDate(filters.from_date);
      }
      if (filters?.to_date) {
        params.to_date = this.formatDate(filters.to_date);
      }
      if (filters?.customer) {
        params.customer = filters.customer;
      }

      const response = await this.client.get("/method/frappe.desk.query_report.run", {
        params,
      });

      return response.data.message.result || [];
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to get AR report: ${(error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  /**
   * Find customer by email
   */
  private async findCustomer(email: string): Promise<{ name: string } | null> {
    try {
      const response = await this.client.get("/resource/Customer", {
        params: {
          filters: JSON.stringify([["email_id", "=", email]]),
          limit: 1,
        },
      });

      return response.data.data?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find item by code
   */
  private async findItem(itemCode: string): Promise<{ name: string } | null> {
    try {
      const response = await this.client.get("/resource/Item", {
        params: {
          filters: JSON.stringify([["item_code", "=", itemCode]]),
          limit: 1,
        },
      });

      return response.data.data?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format date for ERPNext (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
