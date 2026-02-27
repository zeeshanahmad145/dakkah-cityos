// @ts-nocheck
import { useState } from "react";
import { t } from "../../lib/i18n";

interface LineItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  display_id: number;
  status: string;
  created_at: string;
  customer_name: string;
  shipping_address: {
    address_1: string;
    city: string;
    province: string;
    postal_code: string;
    country_code: string;
  };
  items: LineItem[];
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  tracking_number?: string;
}

interface VendorOrderDetailProps {
  orderId: string;
  locale: string;
}

function maskName(name: string): string {
  if (!name || name.length < 2) return "***";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-ds-warning/15 text-ds-warning",
  confirmed: "bg-ds-info/15 text-ds-info",
  shipped: "bg-ds-primary/15 text-ds-primary",
  delivered: "bg-ds-success/15 text-ds-success",
  cancelled: "bg-ds-destructive/15 text-ds-destructive",
};

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"];

function VendorOrderDetail({ orderId, locale }: VendorOrderDetailProps) {
  const [trackingNumber, setTrackingNumber] = useState("");

  const order: OrderDetail = {
    id: orderId,
    display_id: 1042,
    status: "confirmed",
    created_at: new Date().toISOString(),
    customer_name: "John Smith",
    shipping_address: {
      address_1: "123 Main Street",
      city: "Springfield",
      province: "IL",
      postal_code: "62701",
      country_code: "US",
    },
    items: [
      { id: "li_1", product_name: "Premium Widget", quantity: 2, unit_price: 49.99, subtotal: 99.98 },
      { id: "li_2", product_name: "Standard Gadget", quantity: 1, unit_price: 29.99, subtotal: 29.99 },
      { id: "li_3", product_name: "Deluxe Accessory", quantity: 3, unit_price: 14.99, subtotal: 44.97 },
    ],
    subtotal: 174.94,
    shipping_total: 9.99,
    tax_total: 14.82,
    total: 199.75,
    tracking_number: undefined,
  };

  const currentStatusIndex = STATUS_FLOW.indexOf(order.status);

  const handleStatusUpdate = (_newStatus: string) => {
    void orderId;
  };

  const handleTrackingSubmit = () => {
    if (trackingNumber.trim()) {
      void orderId;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-foreground">
            {t(locale, "vendor.orders.orderDetail") !== "vendor.orders.orderDetail"
              ? t(locale, "vendor.orders.orderDetail")
              : "Order Detail"}
            {" "}#{order.display_id}
          </h1>
          <p className="text-ds-muted-foreground">
            {t(locale, "vendor.orders.placed") !== "vendor.orders.placed"
              ? t(locale, "vendor.orders.placed")
              : "Placed on"}{" "}
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            STATUS_STYLES[order.status] || "bg-ds-surface text-ds-muted-foreground"
          }`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-ds-card border border-ds-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-ds-muted-foreground mb-3">
            {t(locale, "vendor.orders.customer") !== "vendor.orders.customer"
              ? t(locale, "vendor.orders.customer")
              : "Customer"}
          </h3>
          <p className="text-ds-foreground font-medium">{maskName(order.customer_name)}</p>
        </div>

        <div className="bg-ds-card border border-ds-border rounded-lg p-6 lg:col-span-2">
          <h3 className="text-sm font-medium text-ds-muted-foreground mb-3">
            {t(locale, "vendor.orders.shippingAddress") !== "vendor.orders.shippingAddress"
              ? t(locale, "vendor.orders.shippingAddress")
              : "Shipping Address"}
          </h3>
          <p className="text-ds-foreground">
            {order.shipping_address.address_1}<br />
            {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}<br />
            {order.shipping_address.country_code}
          </p>
        </div>
      </div>

      <div className="bg-ds-card border border-ds-border rounded-lg">
        <div className="p-6 border-b border-ds-border">
          <h2 className="text-lg font-semibold text-ds-foreground">
            {t(locale, "vendor.orders.lineItems") !== "vendor.orders.lineItems"
              ? t(locale, "vendor.orders.lineItems")
              : "Line Items"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ds-surface">
              <tr>
                <th className="text-start p-4 text-sm font-medium text-ds-muted-foreground">
                  {t(locale, "vendor.orders.product") !== "vendor.orders.product"
                    ? t(locale, "vendor.orders.product")
                    : "Product"}
                </th>
                <th className="text-end p-4 text-sm font-medium text-ds-muted-foreground">
                  {t(locale, "vendor.orders.quantity") !== "vendor.orders.quantity"
                    ? t(locale, "vendor.orders.quantity")
                    : "Qty"}
                </th>
                <th className="text-end p-4 text-sm font-medium text-ds-muted-foreground">
                  {t(locale, "vendor.orders.price") !== "vendor.orders.price"
                    ? t(locale, "vendor.orders.price")
                    : "Price"}
                </th>
                <th className="text-end p-4 text-sm font-medium text-ds-muted-foreground">
                  {t(locale, "vendor.orders.subtotal") !== "vendor.orders.subtotal"
                    ? t(locale, "vendor.orders.subtotal")
                    : "Subtotal"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {(order.items || []).map((item) => (
                <tr key={item.id} className="hover:bg-ds-surface/50">
                  <td className="p-4 text-sm font-medium text-ds-foreground">{item.product_name}</td>
                  <td className="p-4 text-sm text-ds-foreground text-end">{item.quantity}</td>
                  <td className="p-4 text-sm text-ds-foreground text-end">${item.unit_price.toFixed(2)}</td>
                  <td className="p-4 text-sm font-medium text-ds-foreground text-end">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-ds-border">
          <div className="flex flex-col items-end gap-2">
            <div className="flex justify-between w-64">
              <span className="text-sm text-ds-muted-foreground">
                {t(locale, "vendor.orders.subtotal") !== "vendor.orders.subtotal"
                  ? t(locale, "vendor.orders.subtotal")
                  : "Subtotal"}
              </span>
              <span className="text-sm text-ds-foreground">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-sm text-ds-muted-foreground">
                {t(locale, "vendor.orders.shipping") !== "vendor.orders.shipping"
                  ? t(locale, "vendor.orders.shipping")
                  : "Shipping"}
              </span>
              <span className="text-sm text-ds-foreground">${order.shipping_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-sm text-ds-muted-foreground">
                {t(locale, "vendor.orders.taxes") !== "vendor.orders.taxes"
                  ? t(locale, "vendor.orders.taxes")
                  : "Taxes"}
              </span>
              <span className="text-sm text-ds-foreground">${order.tax_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64 pt-2 border-t border-ds-border">
              <span className="text-sm font-semibold text-ds-foreground">
                {t(locale, "vendor.orders.total") !== "vendor.orders.total"
                  ? t(locale, "vendor.orders.total")
                  : "Total"}
              </span>
              <span className="text-sm font-bold text-ds-foreground">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-ds-card border border-ds-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-ds-foreground mb-4">
          {t(locale, "vendor.orders.updateStatus") !== "vendor.orders.updateStatus"
            ? t(locale, "vendor.orders.updateStatus")
            : "Update Status"}
        </h2>
        <div className="flex gap-3 flex-wrap">
          {currentStatusIndex < STATUS_FLOW.indexOf("confirmed") && (
            <button
              onClick={() => handleStatusUpdate("confirmed")}
              className="px-4 py-2 bg-ds-primary text-white rounded-lg text-sm font-medium hover:bg-ds-primary/90 transition-colors"
            >
              {t(locale, "vendor.orders.confirm") !== "vendor.orders.confirm"
                ? t(locale, "vendor.orders.confirm")
                : "Confirm Order"}
            </button>
          )}
          {currentStatusIndex < STATUS_FLOW.indexOf("shipped") && currentStatusIndex >= STATUS_FLOW.indexOf("confirmed") && (
            <button
              onClick={() => handleStatusUpdate("shipped")}
              className="px-4 py-2 bg-ds-primary text-white rounded-lg text-sm font-medium hover:bg-ds-primary/90 transition-colors"
            >
              {t(locale, "vendor.orders.ship") !== "vendor.orders.ship"
                ? t(locale, "vendor.orders.ship")
                : "Mark as Shipped"}
            </button>
          )}
          {currentStatusIndex < STATUS_FLOW.indexOf("delivered") && currentStatusIndex >= STATUS_FLOW.indexOf("shipped") && (
            <button
              onClick={() => handleStatusUpdate("delivered")}
              className="px-4 py-2 bg-ds-success text-white rounded-lg text-sm font-medium hover:bg-ds-success/90 transition-colors"
            >
              {t(locale, "vendor.orders.deliver") !== "vendor.orders.deliver"
                ? t(locale, "vendor.orders.deliver")
                : "Mark as Delivered"}
            </button>
          )}
          {order.status === "delivered" && (
            <p className="text-sm text-ds-muted-foreground py-2">
              {t(locale, "vendor.orders.orderCompleted") !== "vendor.orders.orderCompleted"
                ? t(locale, "vendor.orders.orderCompleted")
                : "This order has been completed."}
            </p>
          )}
        </div>
      </div>

      <div className="bg-ds-card border border-ds-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-ds-foreground mb-4">
          {t(locale, "vendor.orders.fulfillment") !== "vendor.orders.fulfillment"
            ? t(locale, "vendor.orders.fulfillment")
            : "Fulfillment"}
        </h2>
        {order.tracking_number ? (
          <div>
            <p className="text-sm text-ds-muted-foreground mb-1">
              {t(locale, "vendor.orders.trackingNumber") !== "vendor.orders.trackingNumber"
                ? t(locale, "vendor.orders.trackingNumber")
                : "Tracking Number"}
            </p>
            <p className="text-ds-foreground font-medium">{order.tracking_number}</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder={
                t(locale, "vendor.orders.enterTracking") !== "vendor.orders.enterTracking"
                  ? t(locale, "vendor.orders.enterTracking")
                  : "Enter tracking number"
              }
              className="flex-1 px-4 py-2 border border-ds-border rounded-lg bg-ds-surface text-ds-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
            />
            <button
              onClick={handleTrackingSubmit}
              className="px-4 py-2 bg-ds-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t(locale, "vendor.orders.saveTracking") !== "vendor.orders.saveTracking"
                ? t(locale, "vendor.orders.saveTracking")
                : "Save Tracking"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorOrderDetail;
