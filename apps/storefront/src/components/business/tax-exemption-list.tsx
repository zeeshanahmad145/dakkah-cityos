import { useState } from "react"
import { useTaxExemptions, useCreateTaxExemption, useDeleteTaxExemption } from "@/lib/hooks/use-tax-exemptions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { TaxExemption } from "@/lib/types/approvals"

export function TaxExemptionList() {
  const { data: exemptions, isLoading } = useTaxExemptions()
  const createMutation = useCreateTaxExemption()
  const deleteMutation = useDeleteTaxExemption()
  const [showForm, setShowForm] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tax Exemptions</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Exemption"}
        </Button>
      </div>

      {showForm && <TaxExemptionForm onSubmit={async (data) => { await createMutation.mutateAsync(data); setShowForm(false) }} isPending={createMutation.isPending} />}

      {(!exemptions || exemptions.length === 0) ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No tax exemptions on file</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exemptions.map((exemption) => (
            <ExemptionCard
              key={exemption.id}
              exemption={exemption}
              onDelete={() => deleteMutation.mutate(exemption.id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ExemptionCard({ exemption, onDelete, isDeleting }: { exemption: TaxExemption; onDelete: () => void; isDeleting: boolean }) {
  const statusStyles: Record<string, string> = {
    active: "bg-ds-success text-ds-success",
    expired: "bg-ds-destructive text-ds-destructive",
    revoked: "bg-ds-muted text-ds-foreground",
    pending_review: "bg-ds-warning text-ds-warning",
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{exemption.certificate_number}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[exemption.status] || "bg-ds-muted"}`}>
          {exemption.status.replace("_", " ")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <p>Authority: {exemption.issuing_authority}</p>
        <p>Type: {exemption.exemption_type}</p>
        <p>Valid from: {new Date(exemption.valid_from!).toLocaleDateString()}</p>
        <p>Valid until: {new Date(exemption.valid_until!).toLocaleDateString()}</p>
        {exemption.exempt_percentage && <p>Exemption: {exemption.exempt_percentage}%</p>}
      </div>
      {exemption.status === "active" && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onDelete} disabled={isDeleting}>
            Remove
          </Button>
        </div>
      )}
    </div>
  )
}

function TaxExemptionForm({ onSubmit, isPending }: { onSubmit: (data: Partial<TaxExemption>) => Promise<void>; isPending: boolean }) {
  const [formData, setFormData] = useState({
    certificate_number: "",
    issuing_authority: "",
    exemption_type: "full" as const,
    valid_from: "",
    valid_until: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form aria-label="Tax exemption form" onSubmit={handleSubmit} className="border rounded-lg p-6 bg-muted/20 space-y-4">
      <h3 className="font-semibold">New Tax Exemption</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="Certificate Number" value={formData.certificate_number} onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })} required />
        <Input placeholder="Issuing Authority" value={formData.issuing_authority} onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })} required />
        <Input type="date" placeholder="Valid From" value={formData.valid_from} onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })} required />
        <Input type="date" placeholder="Valid Until" value={formData.valid_until} onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })} required />
      </div>
      <Button type="submit" disabled={isPending}>{isPending ? "Submitting..." : "Submit"}</Button>
    </form>
  )
}
