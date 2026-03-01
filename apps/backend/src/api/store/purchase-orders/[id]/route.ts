import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

/**
 * GET /store/purchase-orders/:id
 * Get purchase order details
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as unknown as any;
  const { id } = req.params;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;

  try {
    const purchaseOrder = await companyModule.retrievePurchaseOrder(id);

    if (purchaseOrder.customer_id !== customerId) {
      try {
        const employees = await companyModule.listCompanyEmployees({
          company_id: purchaseOrder.company_id,
          customer_id: customerId,
        });
        const employeeList = Array.isArray(employees)
          ? employees
          : [employees].filter(Boolean);
        if (employeeList.length === 0) {
          return res.status(403).json({ message: "Access denied" });
        }
      } catch {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    let items: any[] = [];
    try {
      const rawItems = await companyModule.listPurchaseOrderItems({
        purchase_order_id: id,
      });
      items = Array.isArray(rawItems) ? rawItems : [rawItems].filter(Boolean);
    } catch {}
    if (items.length === 0) {
      try {
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL });
        const result = await pool.query(
          "SELECT id, purchase_order_id, title, description, sku, quantity, unit_price, subtotal, total, status FROM purchase_order_item WHERE purchase_order_id = $1 AND deleted_at IS NULL ORDER BY created_at",
          [id]
        );
        await pool.end();
        items = result.rows;
      } catch {}
    }

    let company: any = null;
    try {
      company = await companyModule.retrieveCompany(purchaseOrder.company_id);
    } catch {}

    const enriched = enrichDetailItem(
      { ...purchaseOrder, items, company },
      "b2b",
    );
    res.json({ purchase_order: enriched });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-PURCHASE-ORDERS-ID");
  }
}

/**
 * DELETE /store/purchase-orders/:id
 * Cancel a purchase order (only if draft)
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const companyModule = req.scope.resolve("company") as unknown as any;
  const { id } = req.params;

  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const customerId = req.auth_context.actor_id;

  try {
    const purchaseOrder = await companyModule.retrievePurchaseOrder(id);

    // Verify ownership
    if (purchaseOrder.customer_id !== customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only draft POs can be cancelled
    if (purchaseOrder.status !== "draft") {
      return res.status(400).json({
        message: "Only draft purchase orders can be cancelled",
      });
    }

    await companyModule.updatePurchaseOrders({
      id,
      status: "cancelled",
      cancelled_at: new Date(),
    });

    res.json({ message: "Purchase order cancelled" });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-PURCHASE-ORDERS-ID");
  }
}
