// @ts-nocheck
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
import {
  Buildings,
  CurrencyDollar,
  DocumentText,
  Users,
  Check,
  XMark,
  Plus,
  Trash,
} from "@medusajs/icons";
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useCompany,
  useUpdateCompany,
  useApproveCompany,
  useCompanyCredit,
  useUpdateCreditLimit,
  useAdjustCredit,
  useSpendingLimits,
  useUpdateSpendingLimit,
  useTaxExemptions,
  useCreateTaxExemption,
  useVerifyTaxExemption,
  useDeleteTaxExemption,
  TaxExemption,
} from "../../../hooks/use-companies.js";

function CreditManagementSection({ companyId }: { companyId: string }) {
  const { data: credit, isLoading } = useCompanyCredit(companyId);
  const updateCreditLimit = useUpdateCreditLimit();
  const adjustCredit = useAdjustCredit();

  const [newLimit, setNewLimit] = useState("");
  const [newTerms, setNewTerms] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract" | "reset">(
    "subtract",
  );
  const [adjustReason, setAdjustReason] = useState("");

  if (isLoading) return <div className="p-4">Loading credit info...</div>;
  if (!credit) return null;

  const handleUpdateLimit = async () => {
    try {
      await updateCreditLimit.mutateAsync({
        id: companyId,
        credit_limit: newLimit ? parseFloat(newLimit) : undefined,
        payment_terms_days: newTerms ? parseInt(newTerms) : undefined,
        reason: "Admin adjustment",
      });
      toast.success("Credit limit updated");
      setNewLimit("");
      setNewTerms("");
    } catch (error) {
      toast.error("Failed to update credit limit");
    }
  };

  const handleAdjustCredit = async () => {
    if (!adjustReason) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      await adjustCredit.mutateAsync({
        id: companyId,
        amount: parseFloat(adjustAmount) || 0,
        type: adjustType,
        reason: adjustReason,
      });
      toast.success("Credit adjusted");
      setAdjustAmount("");
      setAdjustReason("");
    } catch (error) {
      toast.error("Failed to adjust credit");
    }
  };

  const utilizationPercent =
    credit.credit_limit > 0
      ? Math.round((credit.credit_used / credit.credit_limit) * 100)
      : 0;

  return (
    <Container className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <CurrencyDollar />
        <Heading level="h2">Credit Management</Heading>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-ui-bg-subtle rounded-lg">
          <Text className="text-ui-fg-subtle text-sm">Credit Limit</Text>
          <Text className="text-2xl font-bold">
            ${credit.credit_limit.toLocaleString()}
          </Text>
        </div>
        <div className="p-4 bg-ui-bg-subtle rounded-lg">
          <Text className="text-ui-fg-subtle text-sm">Credit Used</Text>
          <Text className="text-2xl font-bold">
            ${credit.credit_used.toLocaleString()}
          </Text>
        </div>
        <div className="p-4 bg-ui-bg-subtle rounded-lg">
          <Text className="text-ui-fg-subtle text-sm">Available Credit</Text>
          <Text className="text-2xl font-bold text-ui-fg-success">
            ${credit.available_credit.toLocaleString()}
          </Text>
        </div>
        <div className="p-4 bg-ui-bg-subtle rounded-lg">
          <Text className="text-ui-fg-subtle text-sm">Payment Terms</Text>
          <Text className="text-2xl font-bold">
            Net {credit.payment_terms_days}
          </Text>
        </div>
      </div>

      <div className="mb-4">
        <Text className="text-sm text-ui-fg-subtle mb-1">
          Credit Utilization
        </Text>
        <div className="w-full bg-ui-bg-subtle rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              utilizationPercent > 80
                ? "bg-ui-tag-red-bg"
                : utilizationPercent > 50
                  ? "bg-ui-tag-orange-bg"
                  : "bg-ui-tag-green-bg"
            }`}
            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
          />
        </div>
        <Text className="text-sm text-ui-fg-muted mt-1">
          {utilizationPercent}% utilized
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="p-4 border rounded-lg">
          <Heading level="h3" className="mb-3">
            Update Credit Limit
          </Heading>
          <div className="space-y-3">
            <div>
              <Label>New Credit Limit ($)</Label>
              <Input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value as any)}
                placeholder={credit.credit_limit.toString()}
              />
            </div>
            <div>
              <Label>Payment Terms (days)</Label>
              <Input
                type="number"
                value={newTerms}
                onChange={(e) => setNewTerms(e.target.value as any)}
                placeholder={credit.payment_terms_days.toString()}
              />
            </div>
            <Button
              onClick={handleUpdateLimit}
              isLoading={updateCreditLimit.isPending}
            >
              Update Limit
            </Button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Heading level="h3" className="mb-3">
            Manual Credit Adjustment
          </Heading>
          <div className="space-y-3">
            <div>
              <Label>Adjustment Type</Label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="subtract">
                  Release Credit (Payment Received)
                </option>
                <option value="add">Reserve Credit (Order Placed)</option>
                <option value="reset">Reset to Zero</option>
              </select>
            </div>
            {adjustType !== "reset" && (
              <div>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value as any)}
                  placeholder="0.00"
                />
              </div>
            )}
            <div>
              <Label>Reason (required)</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value as any)}
                placeholder="e.g., Payment received - Invoice #1234"
              />
            </div>
            <Button
              onClick={handleAdjustCredit}
              isLoading={adjustCredit.isPending}
            >
              Apply Adjustment
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

function SpendingLimitsSection({ companyId }: { companyId: string }) {
  const { data, isLoading } = useSpendingLimits(companyId);
  const updateLimit = useUpdateSpendingLimit();

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState("");

  if (isLoading) return <div className="p-4">Loading spending limits...</div>;
  if (!data) return null;

  const handleUpdate = async (userId: string) => {
    try {
      await updateLimit.mutateAsync({
        companyId,
        user_id: userId,
        spending_limit: newLimit ? parseFloat(newLimit) : undefined,
      });
      toast.success("Spending limit updated");
      setEditingUser(null);
      setNewLimit("");
    } catch (error) {
      toast.error("Failed to update spending limit");
    }
  };

  return (
    <Container className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users />
        <Heading level="h2">User Spending Limits</Heading>
      </div>

      <div className="mb-4 p-3 bg-ui-bg-subtle rounded-lg">
        <Text className="text-sm">
          Company Auto-Approve Limit:{" "}
          <strong>
            $
            {parseFloat(
              data.company_auto_approve_limit || "0",
            ).toLocaleString()}
          </strong>
          {" | "}
          Requires Approval:{" "}
          <strong>{data.requires_approval ? "Yes" : "No"}</strong>
        </Text>
      </div>

      {data.users?.length === 0 ? (
        <Text className="text-ui-fg-muted">No users in this company</Text>
      ) : (
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left text-ui-fg-subtle">
              <th className="p-3">User ID</th>
              <th className="p-3">Role</th>
              <th className="p-3">Spending Limit</th>
              <th className="p-3">Can Approve</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.users?.map((user: any) => (
              <tr key={user.id} className="border-b">
                <td className="p-3 font-mono text-sm">{user.customer_id}</td>
                <td className="p-3">
                  <Badge>{user.role}</Badge>
                </td>
                <td className="p-3">
                  {editingUser === user.id ? (
                    <Input
                      type="number"
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value as any)}
                      placeholder={user.spending_limit || "No limit"}
                      className="w-32"
                    />
                  ) : user.spending_limit ? (
                    `$${parseFloat(user.spending_limit).toLocaleString()}`
                  ) : (
                    "No limit"
                  )}
                </td>
                <td className="p-3">
                  {user.can_approve ? (
                    <Check className="text-ui-fg-success" />
                  ) : (
                    <XMark className="text-ui-fg-muted" />
                  )}
                </td>
                <td className="p-3">
                  {editingUser === user.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        onClick={() => handleUpdate(user.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => setEditingUser(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => {
                        setEditingUser(user.id);
                        setNewLimit(user.spending_limit || "");
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Container>
  );
}

function TaxExemptionsSection({ companyId }: { companyId: string }) {
  const { data: exemptions, isLoading } = useTaxExemptions(companyId);
  const createExemption = useCreateTaxExemption();
  const verifyExemption = useVerifyTaxExemption();
  const deleteExemption = useDeleteTaxExemption();

  const [showForm, setShowForm] = useState(false);
  const [certNumber, setCertNumber] = useState("");
  const [certType, setCertType] = useState("resale" as any);
  const [state, setState] = useState("");
  const [expiration, setExpiration] = useState("");

  const handleCreate = async () => {
    if (!certNumber) {
      toast.error("Certificate number is required");
      return;
    }
    try {
      await createExemption.mutateAsync({
        companyId,
        certificate_number: certNumber,
        certificate_type: certType,
        issuing_state: state || undefined,
        expiration_date: expiration || undefined,
      });
      toast.success("Tax exemption added");
      setShowForm(false);
      setCertNumber("");
      setCertType("resale");
      setState("");
      setExpiration("");
    } catch (error) {
      toast.error("Failed to add tax exemption");
    }
  };

  const handleVerify = async (
    exemption: TaxExemption,
    status: "verified" | "rejected",
  ) => {
    try {
      await verifyExemption.mutateAsync({
        companyId,
        exemption_id: exemption.id,
        status,
        verified_by: "admin",
      });
      toast.success(`Exemption ${status}`);
    } catch (error) {
      toast.error("Failed to update exemption");
    }
  };

  const handleDelete = async (exemptionId: string) => {
    if (!confirm("Delete this tax exemption?")) return;
    try {
      await deleteExemption.mutateAsync({
        companyId,
        exemption_id: exemptionId,
      });
      toast.success("Tax exemption deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  if (isLoading) return <div className="p-4">Loading tax exemptions...</div>;

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DocumentText />
          <Heading level="h2">Tax Exemptions</Heading>
        </div>
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          <Plus /> Add Exemption
        </Button>
      </div>

      {showForm && (
        <div className="p-4 border rounded-lg mb-4 bg-ui-bg-subtle">
          <Heading level="h3" className="mb-3">
            Add Tax Exemption Certificate
          </Heading>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Certificate Number</Label>
              <Input
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value as any)}
                placeholder="Enter certificate number"
              />
            </div>
            <div>
              <Label>Certificate Type</Label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="resale">Resale Certificate</option>
                <option value="nonprofit">Non-Profit</option>
                <option value="government">Government</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Issuing State</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value as any)}
                placeholder="e.g., CA, NY"
              />
            </div>
            <div>
              <Label>Expiration Date</Label>
              <Input
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value as any)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleCreate}
              isLoading={createExemption.isPending}
            >
              Add Certificate
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!exemptions?.length ? (
        <Text className="text-ui-fg-muted">No tax exemptions on file</Text>
      ) : (
        <div className="space-y-3">
          {exemptions.map((exemption) => (
            <div
              key={exemption.id}
              className="p-4 border rounded-lg flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Text className="font-medium">
                    {exemption.certificate_number}
                  </Text>
                  <Badge
                    color={
                      exemption.status === "verified"
                        ? "green"
                        : exemption.status === "rejected"
                          ? "red"
                          : exemption.status === "expired"
                            ? "orange"
                            : "grey"
                    }
                  >
                    {exemption.status}
                  </Badge>
                  <Badge>{exemption.certificate_type}</Badge>
                </div>
                <Text className="text-sm text-ui-fg-subtle">
                  {exemption.issuing_state &&
                    `State: ${exemption.issuing_state} | `}
                  {exemption.expiration_date &&
                    `Expires: ${new Date(exemption.expiration_date).toLocaleDateString()}`}
                </Text>
                {exemption.verified_at && (
                  <Text className="text-xs text-ui-fg-muted">
                    Verified on{" "}
                    {new Date(exemption.verified_at).toLocaleDateString()}
                  </Text>
                )}
              </div>
              <div className="flex gap-2">
                {exemption.status === "pending" && (
                  <>
                    <Button
                      size="small"
                      onClick={() => handleVerify(exemption, "verified")}
                    >
                      <Check /> Verify
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleVerify(exemption, "rejected")}
                    >
                      <XMark /> Reject
                    </Button>
                  </>
                )}
                <Button
                  size="small"
                  variant="transparent"
                  onClick={() => handleDelete(exemption.id)}
                >
                  <Trash className="text-ui-fg-error" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: company, isLoading } = useCompany(id!);
  const updateCompany = useUpdateCompany();
  const approveCompany = useApproveCompany();

  if (isLoading) {
    return <div className="p-8 text-center">Loading company...</div>;
  }

  if (!company) {
    return <div className="p-8 text-center">Company not found</div>;
  }

  const handleApprove = async () => {
    try {
      await approveCompany.mutateAsync(id!);
      toast.success("Company approved");
    } catch (error) {
      toast.error("Failed to approve company");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Buildings className="w-8 h-8" />
            <Heading>{company.name}</Heading>
          </div>
          <Text className="text-ui-fg-subtle">{company.email}</Text>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            color={
              company.status === "active"
                ? "green"
                : company.status === "pending"
                  ? "orange"
                  : company.status === "suspended"
                    ? "red"
                    : "grey"
            }
          >
            {company.status}
          </Badge>
          <Badge>{company.tier}</Badge>
          {company.status === "pending" && (
            <Button
              onClick={handleApprove}
              isLoading={approveCompany.isPending}
            >
              <Check /> Approve Company
            </Button>
          )}
        </div>
      </div>

      <Container className="p-6">
        <Heading level="h2" className="mb-4">
          Company Details
        </Heading>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Text className="text-ui-fg-subtle text-sm">Legal Name</Text>
            <Text className="font-medium">{company.legal_name || "-"}</Text>
          </div>
          <div>
            <Text className="text-ui-fg-subtle text-sm">Tax ID</Text>
            <Text className="font-medium">{company.tax_id || "-"}</Text>
          </div>
          <div>
            <Text className="text-ui-fg-subtle text-sm">Phone</Text>
            <Text className="font-medium">{company.phone || "-"}</Text>
          </div>
          <div>
            <Text className="text-ui-fg-subtle text-sm">Industry</Text>
            <Text className="font-medium">{company.industry || "-"}</Text>
          </div>
          <div>
            <Text className="text-ui-fg-subtle text-sm">Employee Count</Text>
            <Text className="font-medium">{company.employee_count || "-"}</Text>
          </div>
          <div>
            <Text className="text-ui-fg-subtle text-sm">Member Since</Text>
            <Text className="font-medium">
              {new Date(company.created_at).toLocaleDateString()}
            </Text>
          </div>
        </div>
      </Container>

      <CreditManagementSection companyId={id!} />
      <SpendingLimitsSection companyId={id!} />
      <TaxExemptionsSection companyId={id!} />
    </div>
  );
};

export const config = defineRouteConfig({});

export default CompanyDetailPage;
