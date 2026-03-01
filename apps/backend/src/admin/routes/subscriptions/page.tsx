import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Button,
  Badge,
  Input,
  toast,
  Label,
} from "@medusajs/ui";
import {
  ReceiptPercent,
  Plus,
  PencilSquare,
  XCircle,
  CurrencyDollar,
} from "@medusajs/icons";
import { useState } from "react";
import {
  useSubscriptionPlans,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  SubscriptionPlan,
  useSubscriptions,
  usePauseSubscription,
  useResumeSubscription,
  useCancelSubscription,
  Subscription,
} from "../../hooks/use-subscriptions.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { ConfirmModal } from "../../components/modals/confirm-modal.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const SubscriptionsPage = () => {
  const [activeTab, setActiveTab] = useState<"subscriptions" | "plans">(
    "subscriptions",
  );
  const [showCreatePlanDrawer, setShowCreatePlanDrawer] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [pausingSubscription, setPausingSubscription] =
    useState<Subscription | null>(null);
  const [cancelingSubscription, setCancelingSubscription] =
    useState<Subscription | null>(null);

  const [planFormData, setPlanFormData] = useState({
    name: "",
    handle: "",
    description: "",
    billing_interval: "monthly" as any,
    billing_interval_count: 1,
    price: 0,
    currency_code: "usd",
    trial_days: 0,
    status: "active" as "draft" | "active" | "archived",
  });

  const { data: plansData, isLoading: loadingPlans } = useSubscriptionPlans();
  const { data: subscriptionsData, isLoading: loadingSubscriptions } =
    useSubscriptions();

  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const pauseSubscription = usePauseSubscription();
  const resumeSubscription = useResumeSubscription();
  const cancelSubscription = useCancelSubscription();

  const plans = plansData?.plans || [];
  const subscriptions = subscriptionsData?.subscriptions || [];

  const activeSubs = subscriptions.filter(
    (s) => s.status === "active" || s.status === "trialing",
  );
  const mrr = activeSubs.reduce((sum, sub) => {
    const plan = plans.find((p) => p.id === sub.plan_id);
    if (!plan) return sum;
    if (plan.billing_interval === "yearly") return sum + plan.price / 12;
    if (plan.billing_interval === "quarterly") return sum + plan.price / 3;
    if (plan.billing_interval === "weekly") return sum + plan.price * 4;
    if (plan.billing_interval === "daily") return sum + plan.price * 30;
    return sum + plan.price; // monthly
  }, 0);

  const stats = [
    {
      label: "MRR",
      value: `$${mrr.toLocaleString()}`,
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "green" as const,
    },
    {
      label: "Active Subscriptions",
      value: subscriptions.filter((s) => s.status === "active").length,
      color: "green" as const,
    },
    {
      label: "Trialing",
      value: subscriptions.filter((s) => s.status === "trialing").length,
      color: "blue" as const,
    },
    {
      label: "Active Plans",
      value: plans.filter((p) => p.status === "active").length,
    },
  ];

  const handleCreatePlan = async () => {
    try {
      await createPlan.mutateAsync(planFormData);
      toast.success("Plan created successfully");
      setShowCreatePlanDrawer(false);
      resetPlanForm();
    } catch (error) {
      toast.error("Failed to create plan");
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;
    try {
      await updatePlan.mutateAsync({ id: editingPlan.id, ...planFormData });
      toast.success("Plan updated successfully");
      setEditingPlan(null);
      resetPlanForm();
    } catch (error) {
      toast.error("Failed to update plan");
    }
  };

  const handlePauseSubscription = async () => {
    if (!pausingSubscription) return;
    try {
      await pauseSubscription.mutateAsync({ id: pausingSubscription.id });
      toast.success("Subscription paused");
      setPausingSubscription(null);
    } catch (error) {
      toast.error("Failed to pause subscription");
    }
  };

  const handleResumeSubscription = async (id: string) => {
    try {
      await resumeSubscription.mutateAsync(id);
      toast.success("Subscription resumed");
    } catch (error) {
      toast.error("Failed to resume subscription");
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelingSubscription) return;
    try {
      await cancelSubscription.mutateAsync({
        id: cancelingSubscription.id,
        immediate: false,
      });
      toast.success("Subscription will be canceled at period end");
      setCancelingSubscription(null);
    } catch (error) {
      toast.error("Failed to cancel subscription");
    }
  };

  const resetPlanForm = () => {
    setPlanFormData({
      name: "",
      handle: "",
      description: "",
      billing_interval: "monthly" as any,
      billing_interval_count: 1,
      price: 0,
      currency_code: "usd",
      trial_days: 0,
      status: "active",
    });
  };

  const openEditPlanDrawer = (plan: SubscriptionPlan) => {
    setPlanFormData({
      name: plan.name,
      handle: plan.handle,
      description: plan.description || "",
      billing_interval: plan.billing_interval,
      billing_interval_count: plan.billing_interval_count,
      price: plan.price,
      currency_code: plan.currency_code,
      trial_days: plan.trial_days,
      status: plan.status,
    });
    setEditingPlan(plan);
  };

  const subscriptionColumns = [
    {
      key: "customer",
      header: "Customer",
      cell: (s: Subscription) => (
        <div>
          <Text className="font-medium">
            {s.customer?.first_name} {s.customer?.last_name}
          </Text>
          <Text className="text-ui-fg-muted text-sm">{s.customer?.email}</Text>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (s: Subscription) => s.plan?.name || "-",
    },
    {
      key: "status",
      header: "Status",
      cell: (s: Subscription) => <StatusBadge status={s.status} />,
    },
    {
      key: "current_period_end",
      header: "Renews",
      cell: (s: Subscription) =>
        new Date(s.current_period_end).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      cell: (s: Subscription) => (
        <div className="flex gap-1">
          {s.status === "active" && (
            <>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setPausingSubscription(s)}
              >
                Pause
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setCancelingSubscription(s)}
              >
                <XCircle className="w-4 h-4 text-ui-tag-red-icon" />
              </Button>
            </>
          )}
          {s.status === "paused" && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => handleResumeSubscription(s.id)}
            >
              Resume
            </Button>
          )}
        </div>
      ),
    },
  ];

  const planColumns = [
    {
      key: "name",
      header: "Plan Name",
      sortable: true,
      cell: (p: SubscriptionPlan) => (
        <div>
          <Text className="font-medium">{p.name}</Text>
          <Text className="text-ui-fg-muted text-sm">{p.handle}</Text>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (p: SubscriptionPlan) => `$${p.price}/${p.billing_interval}`,
    },
    {
      key: "trial_days",
      header: "Trial",
      cell: (p: SubscriptionPlan) =>
        p.trial_days > 0 ? `${p.trial_days} days` : "-",
    },
    {
      key: "status",
      header: "Active",
      cell: (p: SubscriptionPlan) => (
        <Badge color={p.status === "active" ? "green" : "grey"}>
          {p.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      cell: (p: SubscriptionPlan) => (
        <Button
          variant="transparent"
          size="small"
          onClick={() => openEditPlanDrawer(p)}
        >
          <PencilSquare className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Subscriptions</Heading>
            <Text className="text-ui-fg-muted">
              Manage subscription plans and active subscriptions
            </Text>
          </div>
          <Button onClick={() => setShowCreatePlanDrawer(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <div className="flex gap-4 border-b border-ui-border-base mb-4">
          <button
            className={`pb-2 px-1 ${activeTab === "subscriptions" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`}
            onClick={() => setActiveTab("subscriptions")}
          >
            <div className="flex items-center gap-2">
              <ReceiptPercent className="w-4 h-4" />
              Subscriptions ({subscriptions.length})
            </div>
          </button>
          <button
            className={`pb-2 px-1 ${activeTab === "plans" ? "border-b-2 border-ui-fg-base font-medium" : "text-ui-fg-muted"}`}
            onClick={() => setActiveTab("plans")}
          >
            <div className="flex items-center gap-2">
              <CurrencyDollar className="w-4 h-4" />
              Plans ({plans.length})
            </div>
          </button>
        </div>

        {activeTab === "subscriptions" && (
          <DataTable
            data={subscriptions}
            columns={subscriptionColumns}
            searchable
            searchPlaceholder="Search subscriptions..."
            searchKeys={[]}
            loading={loadingSubscriptions}
            emptyMessage="No subscriptions found"
          />
        )}
        {activeTab === "plans" && (
          <DataTable
            data={plans}
            columns={planColumns}
            searchable
            searchPlaceholder="Search plans..."
            searchKeys={["name", "handle"]}
            loading={loadingPlans}
            emptyMessage="No plans found"
          />
        )}
      </div>

      <FormDrawer
        open={showCreatePlanDrawer || !!editingPlan}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreatePlanDrawer(false);
            setEditingPlan(null);
            resetPlanForm();
          }
        }}
        title={editingPlan ? "Edit Plan" : "Create Plan"}
        onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}
        submitLabel={editingPlan ? "Update" : "Create"}
        loading={createPlan.isPending || updatePlan.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={planFormData.name}
              onChange={(e) =>
                setPlanFormData({ ...planFormData, name: e.target.value })
              }
              placeholder="Pro Plan"
            />
          </div>
          <div>
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={planFormData.handle}
              onChange={(e) =>
                setPlanFormData({ ...planFormData, handle: e.target.value })
              }
              placeholder="pro-plan"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={planFormData.description}
              onChange={(e) =>
                setPlanFormData({
                  ...planFormData,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={planFormData.price}
                onChange={(e) =>
                  setPlanFormData({
                    ...planFormData,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="billing_interval">Billing Interval</Label>
              <select
                id="billing_interval"
                value={planFormData.billing_interval}
                onChange={(e) =>
                  setPlanFormData({
                    ...planFormData,
                    billing_interval: e.target.value as any,
                  })
                }
                className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="trial_days">Trial Days</Label>
            <Input
              id="trial_days"
              type="number"
              value={planFormData.trial_days}
              onChange={(e) =>
                setPlanFormData({
                  ...planFormData,
                  trial_days: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="status"
              checked={planFormData.status === "active"}
              onChange={(e) =>
                setPlanFormData({
                  ...planFormData,
                  status: e.target.checked ? "active" : "draft",
                })
              }
            />
            <Label htmlFor="status">Active</Label>
          </div>
        </div>
      </FormDrawer>

      <ConfirmModal
        open={!!pausingSubscription}
        onOpenChange={() => setPausingSubscription(null)}
        title="Pause Subscription"
        description={`Pause subscription for ${pausingSubscription?.customer?.email}?`}
        onConfirm={handlePauseSubscription}
        confirmLabel="Pause"
        variant="warning"
        loading={pauseSubscription.isPending}
      />
      <ConfirmModal
        open={!!cancelingSubscription}
        onOpenChange={() => setCancelingSubscription(null)}
        title="Cancel Subscription"
        description={`Cancel subscription for ${cancelingSubscription?.customer?.email}?`}
        onConfirm={handleCancelSubscription}
        confirmLabel="Cancel Subscription"
        variant="danger"
        loading={cancelSubscription.isPending}
      />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Subscriptions",
  icon: ReceiptPercent,
});
export default SubscriptionsPage;
