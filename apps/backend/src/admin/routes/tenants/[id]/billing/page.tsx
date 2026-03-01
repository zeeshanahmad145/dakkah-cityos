import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Button,
  Badge,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { CreditCard, Buildings } from "@medusajs/icons";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../lib/client.js";
import { StatsGrid } from "../../../../components/charts/stats-grid.js";

interface TenantBillingData {
  tenant: {
    id: string;
    name: string;
    domain: string;
    status: string;
    plan: string;
    contact_email: string;
  };
  billing: {
    plan: string;
    billing_email: string;
    billing_cycle: string;
    next_billing_date?: string;
    payment_method?: any;
  };
  usage: {
    orders_this_month: number;
    storage_used_mb: number;
    api_calls_this_month: number;
    active_users: number;
    products_count: number;
  };
  limits: {
    max_orders_per_month: number;
    max_products: number;
    max_storage_mb: number;
    max_users: number;
  };
}

function useTenantBilling(id: string) {
  return useQuery({
    queryKey: ["tenant-billing", id],
    queryFn: async () => {
      const { data } = await client.get<TenantBillingData>(
        `/admin/tenants/${id}/billing`,
      );
      return data;
    },
    enabled: !!id,
  });
}

function useUpdateTenantBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      plan?: string;
      billing_email?: string;
    }) => {
      const response = await client.put(`/admin/tenants/${id}/billing`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-billing", variables.id],
      });
    },
  });
}

const TenantBillingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useTenantBilling(id!);
  const updateBilling = useUpdateTenantBilling();

  const [selectedPlan, setSelectedPlan] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  if (isLoading) {
    return <div className="p-8 text-center">Loading billing info...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center">Tenant not found</div>;
  }

  const { tenant, billing, usage, limits } = data;

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;
    try {
      await updateBilling.mutateAsync({ id: id!, plan: selectedPlan });
      toast.success("Plan updated");
      setSelectedPlan("");
    } catch (error) {
      toast.error("Failed to update plan");
    }
  };

  const getUsagePercent = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.round((used / limit) * 100);
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      orders: 100,
      products: 100,
      storage: 500,
      users: 5,
    },
    {
      id: "pro",
      name: "Pro",
      price: 99,
      orders: 10000,
      products: 10000,
      storage: 10000,
      users: 50,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 499,
      orders: -1,
      products: -1,
      storage: -1,
      users: -1,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Buildings />
            <Heading>{tenant.name}</Heading>
          </div>
          <Text className="text-ui-fg-subtle">{tenant.domain}</Text>
        </div>
        <Badge
          color={
            billing.plan === "enterprise"
              ? "purple"
              : billing.plan === "pro"
                ? "blue"
                : "grey"
          }
        >
          {billing.plan} Plan
        </Badge>
      </div>

      <Container className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard />
          <Heading level="h2">Usage & Limits</Heading>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between mb-1">
              <Text className="text-sm">Orders this month</Text>
              <Text className="text-sm font-medium">
                {usage.orders_this_month} /{" "}
                {limits.max_orders_per_month === -1
                  ? "Unlimited"
                  : limits.max_orders_per_month}
              </Text>
            </div>
            <div className="w-full bg-ui-bg-subtle rounded-full h-2">
              <div
                className="bg-ui-tag-blue-bg h-2 rounded-full"
                style={{
                  width: `${Math.min(getUsagePercent(usage.orders_this_month, limits.max_orders_per_month), 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <Text className="text-sm">Products</Text>
              <Text className="text-sm font-medium">
                {usage.products_count} /{" "}
                {limits.max_products === -1 ? "Unlimited" : limits.max_products}
              </Text>
            </div>
            <div className="w-full bg-ui-bg-subtle rounded-full h-2">
              <div
                className="bg-ui-tag-green-bg h-2 rounded-full"
                style={{
                  width: `${Math.min(getUsagePercent(usage.products_count, limits.max_products), 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <Text className="text-sm">Storage</Text>
              <Text className="text-sm font-medium">
                {usage.storage_used_mb} MB /{" "}
                {limits.max_storage_mb === -1
                  ? "Unlimited"
                  : `${limits.max_storage_mb} MB`}
              </Text>
            </div>
            <div className="w-full bg-ui-bg-subtle rounded-full h-2">
              <div
                className="bg-ui-tag-purple-bg h-2 rounded-full"
                style={{
                  width: `${Math.min(getUsagePercent(usage.storage_used_mb, limits.max_storage_mb), 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <Text className="text-sm">Users</Text>
              <Text className="text-sm font-medium">
                {usage.active_users} /{" "}
                {limits.max_users === -1 ? "Unlimited" : limits.max_users}
              </Text>
            </div>
            <div className="w-full bg-ui-bg-subtle rounded-full h-2">
              <div
                className="bg-ui-tag-orange-bg h-2 rounded-full"
                style={{
                  width: `${Math.min(getUsagePercent(usage.active_users, limits.max_users), 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Container>

      <Container className="p-6">
        <Heading level="h2" className="mb-4">
          Change Plan
        </Heading>

        <div className="grid grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                billing.plan === plan.id
                  ? "border-ui-border-interactive bg-ui-bg-subtle-pressed"
                  : selectedPlan === plan.id
                    ? "border-ui-border-interactive"
                    : "hover:border-ui-border-strong"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <Text className="font-medium">{plan.name}</Text>
                {billing.plan === plan.id && (
                  <Badge color="green">Current</Badge>
                )}
              </div>
              <Text className="text-2xl font-bold mb-3">
                ${plan.price}
                <span className="text-sm text-ui-fg-muted">/mo</span>
              </Text>
              <div className="space-y-1 text-sm text-ui-fg-subtle">
                <Text>
                  {plan.orders === -1
                    ? "Unlimited"
                    : plan.orders.toLocaleString()}{" "}
                  orders/mo
                </Text>
                <Text>
                  {plan.products === -1
                    ? "Unlimited"
                    : plan.products.toLocaleString()}{" "}
                  products
                </Text>
                <Text>
                  {plan.storage === -1 ? "Unlimited" : `${plan.storage} MB`}{" "}
                  storage
                </Text>
                <Text>
                  {plan.users === -1 ? "Unlimited" : plan.users} team members
                </Text>
              </div>
            </div>
          ))}
        </div>

        {selectedPlan && selectedPlan !== billing.plan && (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleUpdatePlan}
              isLoading={updateBilling.isPending}
            >
              Upgrade to {plans.find((p) => p.id === selectedPlan)?.name}
            </Button>
          </div>
        )}
      </Container>

      <Container className="p-6">
        <Heading level="h2" className="mb-4">
          Billing Details
        </Heading>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>Billing Email</Label>
            <div className="flex gap-2">
              <Input
                value={billingEmail || billing.billing_email || ""}
                onChange={(e) => setBillingEmail(e.target.value as any)}
                placeholder={tenant.contact_email}
              />
              <Button
                variant="secondary"
                onClick={async () => {
                  if (billingEmail) {
                    try {
                      await updateBilling.mutateAsync({
                        id: id!,
                        billing_email: billingEmail,
                      });
                      toast.success("Billing email updated");
                    } catch {
                      toast.error("Failed to update");
                    }
                  }
                }}
              >
                Update
              </Button>
            </div>
          </div>
          <div>
            <Label>Billing Cycle</Label>
            <Input value={billing.billing_cycle || "monthly"} disabled />
          </div>
          <div>
            <Label>Next Billing Date</Label>
            <Input
              value={
                billing.next_billing_date
                  ? new Date(billing.next_billing_date).toLocaleDateString()
                  : "N/A"
              }
              disabled
            />
          </div>
          <div>
            <Label>Payment Method</Label>
            <Input
              value={
                billing.payment_method
                  ? "Card ending in ****"
                  : "No payment method"
              }
              disabled
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

export const config = defineRouteConfig({});

export default TenantBillingPage;
