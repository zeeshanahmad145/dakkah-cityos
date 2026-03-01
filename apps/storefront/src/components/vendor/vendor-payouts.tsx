import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/utils/sdk";
import { Button } from "@/components/ui/button";

interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at?: string;
  method?: string;
}

interface PayoutSummary {
  available_balance: number;
  pending_balance: number;
  total_paid: number;
}

export function VendorPayouts() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-payouts"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        payouts: Payout[];
        summary: PayoutSummary;
      }>("/vendor/payouts", {
        credentials: "include",
      });
      return response;
    },
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      return sdk.client.fetch("/vendor/payouts/request", {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-payouts"] });
    },
  });

  const payouts = data?.payouts || [];
  const summary = data?.summary;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Payouts</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-ds-success">
            ${(summary?.available_balance || 0).toFixed(2)}
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-3xl font-bold text-ds-warning">
            ${(summary?.pending_balance || 0).toFixed(2)}
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
          <p className="text-3xl font-bold">
            ${(summary?.total_paid || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Request Payout */}
      {(summary?.available_balance || 0) > 0 && (
        <div className="border rounded-lg p-6 bg-ds-success">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-ds-success">Request Payout</h3>
              <p className="text-sm text-ds-success">
                You have ${summary?.available_balance.toFixed(2)} available for withdrawal
              </p>
            </div>
            <Button
              onClick={() => requestPayoutMutation.mutate()}
              disabled={requestPayoutMutation.isPending}
            >
              {requestPayoutMutation.isPending ? "Processing..." : "Request Payout"}
            </Button>
          </div>
        </div>
      )}

      {/* Payout History */}
      <div className="border rounded-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Payout History</h2>
        </div>
        {payouts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No payouts yet
          </div>
        ) : (
          <div className="divide-y">
            {payouts.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">${Number(payout.amount).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    Requested: {new Date(payout.created_at!).toLocaleDateString()}
                    {payout.processed_at && (
                      <> - Processed: {new Date(payout.processed_at!).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <PayoutStatusBadge status={payout.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-ds-warning text-ds-warning",
    processing: "bg-ds-info text-ds-info",
    completed: "bg-ds-success text-ds-success",
    failed: "bg-ds-destructive text-ds-destructive",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || "bg-ds-muted"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
