import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { Users, CurrencyDollar, CheckCircle, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useFreelanceGigs,
  useCreateFreelanceGig,
  FreelanceGig,
} from "../../hooks/use-freelance.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const FreelancePage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    freelancer_id: "",
    category: "",
    listing_type: "hourly" as const,
    currency_code: "usd",
    hourly_rate: 0,
  });

  const { data, isLoading } = useFreelanceGigs();
  const createGig = useCreateFreelanceGig();

  const gigs = data?.items || [];
  const activeFreelancers = gigs.filter(
    (g: any) => g.status === "active",
  ).length;
  const totalCompleted = gigs.length;

  const stats = [
    {
      label: "Total Gigs",
      value: gigs.length,
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Active Freelancers",
      value: activeFreelancers,
      color: "green" as const,
    },
    {
      label: "Completed Projects",
      value: totalCompleted,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "blue" as const,
    },
    {
      label: "Total Listings",
      value: gigs.length,
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "green" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createGig.mutateAsync({
        title: formData.title,
        freelancer_id: formData.freelancer_id,
        category: formData.category,
        listing_type: formData.listing_type,
        currency_code: formData.currency_code,
        hourly_rate: formData.hourly_rate,
        description: formData.title,
        tenant_id: "default",
      });
      toast.success("Gig created");
      setShowCreate(false);
      setFormData({
        title: "",
        freelancer_id: "",
        category: "",
        listing_type: "hourly",
        currency_code: "usd",
        hourly_rate: 0,
      });
    } catch (error) {
      toast.error("Failed to create gig");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Gig",
      sortable: true,
      cell: (g: any) => (
        <div>
          <Text className="font-medium">{g.title}</Text>
          <Text className="text-ui-fg-muted text-sm">{g.freelancer_id}</Text>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (g: any) => <Badge color="grey">{g.category || "—"}</Badge>,
    },
    {
      key: "listing_type",
      header: "Type",
      cell: (g: any) => <Badge color="blue">{g.listing_type}</Badge>,
    },
    {
      key: "hourly_rate",
      header: "Rate",
      sortable: true,
      cell: (g: any) => (
        <Text className="font-medium">
          {g.hourly_rate
            ? `$${g.hourly_rate}/hr`
            : g.price
              ? `$${g.price}`
              : "—"}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (g: any) => <StatusBadge status={g.status || "draft"} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Freelance Marketplace</Heading>
            <Text className="text-ui-fg-muted">
              Manage freelancer gigs, projects, and payments
            </Text>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Gig
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={gigs}
          columns={columns}
          searchable
          searchPlaceholder="Search gigs..."
          searchKeys={["title", "category"]}
          loading={isLoading}
          emptyMessage="No gigs found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Gig"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createGig.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value as any })
              }
              placeholder="Gig title"
            />
          </div>
          <div>
            <Label htmlFor="freelancer_id">Freelancer ID</Label>
            <Input
              id="freelancer_id"
              value={formData.freelancer_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  freelancer_id: e.target.value as any,
                })
              }
              placeholder="Freelancer ID"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as any })
              }
              placeholder="Category"
            />
          </div>
          <div>
            <Label htmlFor="listing_type">Listing Type</Label>
            <select
              id="listing_type"
              value={formData.listing_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  listing_type: e.target.value as any,
                })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="hourly">Hourly</option>
              <option value="fixed_price">Fixed Price</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>
          <div>
            <Label htmlFor="hourly_rate">Rate</Label>
            <Input
              id="hourly_rate"
              type="number"
              value={formData.hourly_rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hourly_rate: Number(e.target.value),
                })
              }
              placeholder="Rate"
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Freelance", icon: Users });
export default FreelancePage;
