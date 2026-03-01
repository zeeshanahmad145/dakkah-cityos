import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Button,
  Badge,
  Input,
  Label,
  Toaster,
} from "@medusajs/ui";
import { CurrencyDollar, Plus, Trash, PencilSquare } from "@medusajs/icons";
import { useState, useEffect } from "react";
import { client } from "../../../lib/client";

interface PaymentTerm {
  id: string;
  name: string;
  code: string;
  net_days: number;
  early_payment_discount_percent: number;
  early_payment_discount_days: number;
  is_default: boolean;
  is_active: boolean;
}

const PaymentTermsPage = () => {
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState<PaymentTerm | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    net_days: 30,
    early_payment_discount_percent: 0,
    early_payment_discount_days: 0,
    is_default: false,
  });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const { data } = await client.get<{ payment_terms: PaymentTerm[] }>(
        "/admin/payment-terms",
      );
      setTerms(data.payment_terms || []);
    } catch (error) {
      console.error("Failed to fetch payment terms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTerm
        ? `/admin/payment-terms/${editingTerm.id}`
        : "/admin/payment-terms";

      const code = generatePreviewCode();
      const payload = { ...formData, code };

      if (editingTerm) {
        await client.put(url, payload);
      } else {
        await client.post(url, payload);
      }

      fetchTerms();
      resetForm();
    } catch (error) {
      console.error("Failed to save payment term:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment term?")) return;

    try {
      await client.delete(`/admin/payment-terms/${id}`);
      fetchTerms();
    } catch (error) {
      console.error("Failed to delete payment term:", error);
    }
  };

  const handleEdit = (term: PaymentTerm) => {
    setEditingTerm(term);
    setFormData({
      name: term.name,
      net_days: term.net_days,
      early_payment_discount_percent: term.early_payment_discount_percent || 0,
      early_payment_discount_days: term.early_payment_discount_days || 0,
      is_default: term.is_default,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTerm(null);
    setFormData({
      name: "",
      net_days: 30,
      early_payment_discount_percent: 0,
      early_payment_discount_days: 0,
      is_default: false,
    });
  };

  const generatePreviewCode = () => {
    if (
      formData.early_payment_discount_percent > 0 &&
      formData.early_payment_discount_days > 0
    ) {
      return `${formData.early_payment_discount_percent}/${formData.early_payment_discount_days} Net ${formData.net_days}`;
    }
    return `Net ${formData.net_days}`;
  };

  if (loading) {
    return (
      <Container className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ui-bg-subtle rounded w-1/3"></div>
          <div className="h-32 bg-ui-bg-subtle rounded"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="p-8">
      <Toaster />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Heading level="h1" className="text-2xl font-bold mb-2">
            Payment Terms
          </Heading>
          <Text className="text-ui-fg-subtle">
            Configure payment terms with early payment discounts for B2B
            customers
          </Text>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          <Plus className="mr-2" />
          Add Payment Term
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-ui-bg-base rounded-lg">
            <CurrencyDollar className="text-ui-fg-subtle" />
          </div>
          <div>
            <Text className="font-medium mb-1">Early Payment Discounts</Text>
            <Text className="text-ui-fg-subtle text-sm">
              Payment terms like "2/10 Net 30" mean customers get a 2% discount
              if they pay within 10 days, otherwise the full amount is due in 30
              days. This encourages faster payment and improves cash flow.
            </Text>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-6 mb-8">
          <Heading level="h2" className="text-lg font-semibold mb-6">
            {editingTerm ? "Edit Payment Term" : "Create Payment Term"}
          </Heading>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value as any })
                  }
                  placeholder="e.g., Standard Net 30"
                  required
                />
              </div>

              {/* Net Days */}
              <div>
                <Label htmlFor="net_days">Net Days (Payment Due)</Label>
                <Input
                  id="net_days"
                  type="number"
                  min={1}
                  max={365}
                  value={formData.net_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      net_days: parseInt(e.target.value) || 30,
                    })
                  }
                  required
                />
                <Text className="text-xs text-ui-fg-subtle mt-1">
                  Full payment due in this many days
                </Text>
              </div>

              {/* Discount Percent */}
              <div>
                <Label htmlFor="early_payment_discount_percent">
                  Early Payment Discount (%)
                </Label>
                <Input
                  id="early_payment_discount_percent"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={formData.early_payment_discount_percent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      early_payment_discount_percent:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <Text className="text-xs text-ui-fg-subtle mt-1">
                  Set to 0 for no early payment discount
                </Text>
              </div>

              {/* Discount Days */}
              <div>
                <Label htmlFor="early_payment_discount_days">
                  Discount Valid For (Days)
                </Label>
                <Input
                  id="early_payment_discount_days"
                  type="number"
                  min={0}
                  max={formData.net_days}
                  value={formData.early_payment_discount_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      early_payment_discount_days:
                        parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={formData.early_payment_discount_percent === 0}
                />
                <Text className="text-xs text-ui-fg-subtle mt-1">
                  Days to pay and receive the discount
                </Text>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-ui-bg-subtle rounded-lg p-4">
              <Text className="text-sm text-ui-fg-subtle mb-2">
                Preview Code:
              </Text>
              <Text className="text-xl font-mono font-bold">
                {generatePreviewCode()}
              </Text>
              {formData.early_payment_discount_percent > 0 && (
                <Text className="text-sm text-ui-fg-subtle mt-2">
                  Customers paying within {formData.early_payment_discount_days}{" "}
                  days save {formData.early_payment_discount_percent}%
                </Text>
              )}
            </div>

            {/* Default checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData({ ...formData, is_default: e.target.checked })
                }
                className="rounded border-ui-border-base"
              />
              <Label htmlFor="is_default">
                Set as default for new B2B customers
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" variant="primary">
                {editingTerm ? "Update" : "Create"} Payment Term
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Terms List */}
      <div className="bg-ui-bg-base border border-ui-border-base rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-ui-bg-subtle border-b border-ui-border-base">
            <tr>
              <th className="text-left p-4 font-medium text-ui-fg-subtle">
                Name
              </th>
              <th className="text-left p-4 font-medium text-ui-fg-subtle">
                Code
              </th>
              <th className="text-left p-4 font-medium text-ui-fg-subtle">
                Net Days
              </th>
              <th className="text-left p-4 font-medium text-ui-fg-subtle">
                Early Discount
              </th>
              <th className="text-left p-4 font-medium text-ui-fg-subtle">
                Status
              </th>
              <th className="text-right p-4 font-medium text-ui-fg-subtle">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {terms.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ui-fg-subtle">
                  No payment terms configured. Create your first payment term
                  above.
                </td>
              </tr>
            ) : (
              terms.map((term) => (
                <tr
                  key={term.id}
                  className="border-b border-ui-border-base last:border-0"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Text className="font-medium">{term.name}</Text>
                      {term.is_default && (
                        <Badge color="green" size="small">
                          Default
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Text className="font-mono">{term.code}</Text>
                  </td>
                  <td className="p-4">
                    <Text>{term.net_days} days</Text>
                  </td>
                  <td className="p-4">
                    {term.early_payment_discount_percent > 0 ? (
                      <div>
                        <Text className="font-medium text-green-600">
                          {term.early_payment_discount_percent}% off
                        </Text>
                        <Text className="text-xs text-ui-fg-subtle">
                          if paid within {term.early_payment_discount_days} days
                        </Text>
                      </div>
                    ) : (
                      <Text className="text-ui-fg-subtle">None</Text>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge color={term.is_active ? "green" : "grey"}>
                      {term.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleEdit(term)}
                      >
                        <PencilSquare className="w-4 h-4" />
                      </Button>
                      {!term.is_default && (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleDelete(term.id)}
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Example Section */}
      <div className="mt-8 bg-ui-bg-subtle rounded-lg p-6">
        <Heading level="h3" className="text-md font-semibold mb-4">
          Common Payment Terms Examples
        </Heading>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-ui-bg-base rounded-lg p-4">
            <Text className="font-mono font-bold mb-1">Net 30</Text>
            <Text className="text-sm text-ui-fg-subtle">
              Full payment due in 30 days, no early discount
            </Text>
          </div>
          <div className="bg-ui-bg-base rounded-lg p-4">
            <Text className="font-mono font-bold mb-1">2/10 Net 30</Text>
            <Text className="text-sm text-ui-fg-subtle">
              2% discount if paid in 10 days, otherwise due in 30
            </Text>
          </div>
          <div className="bg-ui-bg-base rounded-lg p-4">
            <Text className="font-mono font-bold mb-1">1/10 Net 60</Text>
            <Text className="text-sm text-ui-fg-subtle">
              1% discount if paid in 10 days, otherwise due in 60
            </Text>
          </div>
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Payment Terms",
  icon: CurrencyDollar,
});

export default PaymentTermsPage;
