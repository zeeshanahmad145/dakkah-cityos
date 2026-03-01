import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/utils/sdk";

interface Commission {
  id: string;
  order_id: string;
  order_display_id: number;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  commission_rate: number;
  created_at: string;
}

interface CommissionSummary {
  total_gross: number;
  total_commission: number;
  total_net: number;
  commission_rate: number;
}

export function VendorCommissions() {
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-commissions"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        commissions: Commission[];
        summary: CommissionSummary;
      }>("/vendor/commissions", {
        credentials: "include",
      });
      return response;
    },
  });

  const commissions = data?.commissions || [];
  const summary = data?.summary;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
      <h1 className="text-2xl font-bold">Commission History</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">Gross Sales</p>
          <p className="text-2xl font-bold">
            ${(summary?.total_gross || 0).toFixed(2)}
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">Commission Paid</p>
          <p className="text-2xl font-bold text-ds-destructive">
            -${(summary?.total_commission || 0).toFixed(2)}
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">Net Earnings</p>
          <p className="text-2xl font-bold text-ds-success">
            ${(summary?.total_net || 0).toFixed(2)}
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">Commission Rate</p>
          <p className="text-2xl font-bold">
            {summary?.commission_rate || 0}%
          </p>
        </div>
      </div>

      {/* Commission History */}
      <div className="border rounded-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>
        {commissions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No commission history yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start p-4 font-medium">Order</th>
                  <th className="text-start p-4 font-medium">Date</th>
                  <th className="text-end p-4 font-medium">Gross</th>
                  <th className="text-end p-4 font-medium">Commission</th>
                  <th className="text-end p-4 font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {commissions.map((commission) => (
                  <tr key={commission.id}>
                    <td className="p-4">#{commission.order_display_id}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(commission.created_at!).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-end">
                      ${Number(commission.gross_amount).toFixed(2)}
                    </td>
                    <td className="p-4 text-end text-ds-destructive">
                      -${Number(commission.commission_amount).toFixed(2)}
                    </td>
                    <td className="p-4 text-end text-ds-success font-medium">
                      ${Number(commission.net_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
