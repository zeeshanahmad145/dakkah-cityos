import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { CurrencyDollar } from "@medusajs/icons";
import { useEffect, useState } from "react";

type FinancialProduct = {
  id: string;
  name: string;
  product_type: string;
  interest_rate: number;
  min_amount: number;
  max_amount: number;
  tenor_months: number;
  currency_code: string;
  status: string;
  is_sharia_compliant: boolean;
};

const FinancialProductsPage = () => {
  const [products, setProducts] = useState<FinancialProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/admin/financial-products")
      .then((r) => r.json())
      .then((d) => setProducts(d?.financial_products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const byType = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.product_type] = (acc[p.product_type] || 0) + 1;
    return acc;
  }, {});

  const statusColor = (s: string) =>
    s === "active" ? "green" : s === "draft" ? "grey" : "orange";

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base flex items-center justify-between">
        <div>
          <Heading level="h1">Financial Products</Heading>
          <Text className="text-ui-fg-muted">
            Loans, mortgages, insurance, and investment plans
          </Text>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 p-6 border-b border-ui-border-base">
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-muted text-sm">Total Products</Text>
          <Heading level="h2">{products.length}</Heading>
        </div>
        {Object.entries(byType).map(([type, count]) => (
          <div key={type} className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-muted text-sm capitalize">
              {type.replace("_", " ")}
            </Text>
            <Heading level="h2">{count}</Heading>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="px-6 pb-6 pt-4">
        {loading ? (
          <Text className="text-ui-fg-muted">Loading…</Text>
        ) : products.length === 0 ? (
          <Text className="text-ui-fg-muted">No financial products found.</Text>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ui-border-base text-ui-fg-muted text-left">
                <th className="pb-3 pr-4 font-medium">Product</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Rate</th>
                <th className="pb-3 pr-4 font-medium">Range</th>
                <th className="pb-3 pr-4 font-medium">Tenor</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-ui-border-base">
                  <td className="py-3 pr-4">
                    <Text className="font-medium">{p.name}</Text>
                    {p.is_sharia_compliant && (
                      <Badge color="green" className="ml-2 text-xs">
                        Sharia
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4 capitalize">
                    {p.product_type?.replace("_", " ")}
                  </td>
                  <td className="py-3 pr-4">{p.interest_rate ?? "—"}%</td>
                  <td className="py-3 pr-4">
                    {p.min_amount?.toLocaleString()} –{" "}
                    {p.max_amount?.toLocaleString()}{" "}
                    {p.currency_code?.toUpperCase()}
                  </td>
                  <td className="py-3 pr-4">{p.tenor_months} mo</td>
                  <td className="py-3">
                    <Badge color={statusColor(p.status) as any}>
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Financial Products",
  icon: CurrencyDollar,
});
export default FinancialProductsPage;
