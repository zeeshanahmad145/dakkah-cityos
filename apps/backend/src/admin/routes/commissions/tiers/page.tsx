import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Button,
  Badge,
  Input,
  Table,
} from "@medusajs/ui";
import { useEffect, useState } from "react";
import { PlusMini, Trash, PencilSquare, CurrencyDollar } from "@medusajs/icons";
import { sdk } from "../../../lib/client.js";

// Helper to make API calls using the Medusa SDK
async function client(path: string, options?: { method?: string; body?: any }) {
  const method = options?.method || "GET";
  const body = options?.body;

  if (method === "GET") {
    return await sdk.client.fetch(path);
  } else {
    return await sdk.client.fetch(path, { method, body });
  }
}

type CommissionTier = {
  id?: string;
  name: string;
  min_amount: number;
  max_amount: number | null;
  rate: number;
};

type CommissionRule = {
  id: string;
  name: string;
  commission_type: string;
  tiers: CommissionTier[] | null;
};

const CommissionTiersPage = () => {
  const [activeRule, setActiveRule] = useState<CommissionRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    min_amount: 0,
    max_amount: "",
    rate: 0,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = (await client("/admin/commission-rules")) as {
        rules?: CommissionRule[];
      };
      const rules = response.rules || [];

      let tierRule = rules.find(
        (r) => r.commission_type === "tiered_percentage",
      );

      // Auto-initialize a tiered rule instance if the platform lacks one
      if (!tierRule && rules.length >= 0) {
        setLoading(false);
        return;
      }

      setActiveRule(tierRule || null);
    } catch (error) {
      console.error("Error fetching commission rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncTiersToRule = async (newTiers: CommissionTier[]) => {
    try {
      if (!activeRule) {
        // Create the Global Tiered Rule
        const response = await client("/admin/commission-rules", {
          method: "POST",
          body: {
            name: "Global Tiered Commission",
            commission_type: "tiered_percentage",
            tiers: newTiers,
          },
        });
        setActiveRule((response as any).rule);
        return;
      }

      await client(`/admin/commission-rules/${activeRule.id}`, {
        method: "PUT",
        body: {
          tiers: newTiers,
        },
      });

      setActiveRule({ ...activeRule, tiers: newTiers });
    } catch (error) {
      console.error("Error syncing tiers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTier: CommissionTier = {
      id: crypto.randomUUID(),
      name: formData.name,
      min_amount: Number(formData.min_amount),
      max_amount: formData.max_amount ? Number(formData.max_amount) : null,
      rate: Number(formData.rate),
    };

    const currentTiers = activeRule?.tiers || [];
    let updatedTiers = [...currentTiers];

    if (editingTierIndex !== null) {
      updatedTiers[editingTierIndex] = {
        ...newTier,
        id: currentTiers[editingTierIndex].id,
      };
    } else {
      updatedTiers.push(newTier);
    }

    await syncTiersToRule(updatedTiers);

    setShowForm(false);
    setEditingTierIndex(null);
    setFormData({ name: "", min_amount: 0, max_amount: "", rate: 0 });
    await fetchRules();
  };

  const handleDelete = async (index: number) => {
    if (!confirm("Are you sure you want to delete this tier?")) return;

    const currentTiers = activeRule?.tiers || [];
    const updatedTiers = currentTiers.filter((_, i) => i !== index);

    await syncTiersToRule(updatedTiers);
  };

  const handleEdit = (tier: CommissionTier, index: number) => {
    setEditingTierIndex(index);
    setFormData({
      name: tier.name,
      min_amount: tier.min_amount,
      max_amount: tier.max_amount?.toString() || "",
      rate: tier.rate,
    });
    setShowForm(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Container className="p-8">
        <Text>Loading...</Text>
      </Container>
    );
  }

  const tiers = activeRule?.tiers || [];

  return (
    <Container className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level="h1">Commission Tiers</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Configure tiered commission rates embedded in the standard
            Commission Rules
          </Text>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingTierIndex(null);
          }}
        >
          <PlusMini className="mr-2" />
          Add Tier
        </Button>
      </div>

      {showForm && (
        <Container className="mb-6 p-4 bg-ui-bg-subtle rounded-lg">
          <Heading level="h2" className="mb-4">
            {editingTierIndex !== null ? "Edit Tier" : "New Tier"}
          </Heading>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value as any })
                  }
                  placeholder="e.g., Bronze, Silver, Gold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Commission Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Min Revenue ($)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_amount: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Revenue ($)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.max_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_amount: e.target.value as any,
                    })
                  }
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingTierIndex !== null ? "Update" : "Create"} Tier
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingTierIndex(null);
                  setFormData({
                    name: "",
                    min_amount: 0,
                    max_amount: "",
                    rate: 0,
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Container>
      )}

      {tiers.length === 0 ? (
        <Container className="p-8 text-center bg-ui-bg-subtle rounded-lg">
          <CurrencyDollar className="w-12 h-12 mx-auto mb-4 text-ui-fg-subtle" />
          <Text className="text-ui-fg-subtle">
            No commission tiers configured. Add tiers to apply different rates
            based on vendor revenue.
          </Text>
        </Container>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Tier Name</Table.HeaderCell>
              <Table.HeaderCell>Revenue Range</Table.HeaderCell>
              <Table.HeaderCell>Commission Rate</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Actions
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {tiers
              .sort((a, b) => a.min_amount - b.min_amount)
              .map((tier, index) => (
                <Table.Row key={index}>
                  <Table.Cell>
                    <Text className="font-medium">{tier.name}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>
                      {formatCurrency(tier.min_amount)} -{" "}
                      {tier.max_amount
                        ? formatCurrency(tier.max_amount)
                        : "Unlimited"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue">{tier.rate}%</Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleEdit(tier, index)}
                      >
                        <PencilSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Commission Tiers",
  icon: CurrencyDollar,
});

export default CommissionTiersPage;
