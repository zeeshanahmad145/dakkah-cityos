import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/utils/sdk";
import { Button } from "@/components/ui/button";

interface VendorOrderItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  thumbnail?: string;
}

interface VendorOrder {
  id: string;
  display_id: number;
  status: string;
  created_at: string;
  email: string;
  items: VendorOrderItem[];
  vendor_total: number;
  shipping_address?: {
    address_1?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country_code?: string;
  };
}

export function VendorOrderList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ orders: VendorOrder[] }>("/vendor/orders", {
        credentials: "include",
      });
      return response;
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return sdk.client.fetch(`/vendor/orders/${orderId}/fulfill`, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    },
  });

  const orders = data?.orders || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg">
              <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                <div>
                  <span className="font-semibold">Order #{order.display_id}</span>
                  <span className="text-muted-foreground ms-4">
                    {new Date(order.created_at!).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  {order.status === "pending" && (
                    <Button
                      size="fit"
                      onClick={() => fulfillMutation.mutate(order.id)}
                      disabled={fulfillMutation.isPending}
                    >
                      Fulfill
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Customer: {order.email}
                </p>

                <div className="space-y-2">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} x ${Number(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div>
                    {order.shipping_address && (
                      <p className="text-sm text-muted-foreground">
                        Ship to: {order.shipping_address.city}, {order.shipping_address.country_code?.toUpperCase()}
                      </p>
                    )}
                  </div>
                  <p className="font-bold">
                    Your Total: ${Number(order.vendor_total).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-ds-warning text-ds-warning",
    processing: "bg-ds-info text-ds-info",
    completed: "bg-ds-success text-ds-success",
    cancelled: "bg-ds-destructive text-ds-destructive",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || "bg-ds-muted"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
