import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, Input, toast, Label } from "@medusajs/ui"
import { EllipsisHorizontal, Plus, PencilSquare, Trash } from "@medusajs/icons"
import { useState } from "react"
import { useTranslations, useCreateTranslation, useUpdateTranslation, useDeleteTranslation, Translation } from "../../hooks/use-i18n.js"
import { DataTable } from "../../components/tables/data-table.js"
import { StatsGrid } from "../../components/charts/stats-grid.js"
import { FormDrawer } from "../../components/forms/form-drawer.js"
import { ConfirmModal } from "../../components/modals/confirm-modal.js"

const LOCALES = ["en", "fr", "ar", "de", "es", "zh", "ja", "ko", "pt", "ru"] as const

const getLocaleBadgeColor = (locale: string) => {
  switch (locale) {
    case "en": return "blue"
    case "fr": return "purple"
    case "ar": return "green"
    case "de": return "orange"
    case "es": return "red"
    default: return "grey"
  }
}

const I18nPage = () => {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null)
  const [deletingTranslation, setDeletingTranslation] = useState<Translation | null>(null)

  const [formData, setFormData] = useState({
    locale: "en",
    namespace: "",
    key: "",
    value: "",
  })

  const { data: translationsData, isLoading } = useTranslations()
  const createTranslation = useCreateTranslation()
  const updateTranslation = useUpdateTranslation()
  const deleteTranslation = useDeleteTranslation()

  const translations = translationsData?.translations || []
  const uniqueLocales = new Set(translations.map(t => t.locale)).size
  const uniqueNamespaces = new Set(translations.map(t => t.namespace)).size

  const stats = [
    { label: "Total Translations", value: translations.length, icon: <EllipsisHorizontal className="w-5 h-5" /> },
    { label: "Locales", value: uniqueLocales, color: "blue" as const },
    { label: "Namespaces", value: uniqueNamespaces, color: "green" as const },
    { label: "Keys", value: new Set(translations.map(t => t.key)).size, color: "purple" as const },
  ]

  const handleCreate = async () => {
    try {
      await createTranslation.mutateAsync(formData)
      toast.success("Translation created successfully")
      setShowCreateDrawer(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create translation")
    }
  }

  const handleUpdate = async () => {
    if (!editingTranslation) return
    try {
      await updateTranslation.mutateAsync({ id: editingTranslation.id, ...formData })
      toast.success("Translation updated successfully")
      setEditingTranslation(null)
      resetForm()
    } catch (error) {
      toast.error("Failed to update translation")
    }
  }

  const handleDelete = async () => {
    if (!deletingTranslation) return
    try {
      await deleteTranslation.mutateAsync(deletingTranslation.id)
      toast.success("Translation deleted")
      setDeletingTranslation(null)
    } catch (error) {
      toast.error("Failed to delete translation")
    }
  }

  const resetForm = () => {
    setFormData({ locale: "en", namespace: "", key: "", value: "" })
  }

  const openEditDrawer = (translation: Translation) => {
    setFormData({
      locale: translation.locale,
      namespace: translation.namespace,
      key: translation.key,
      value: translation.value,
    })
    setEditingTranslation(translation)
  }

  const columns = [
    { key: "locale", header: "Locale", cell: (t: Translation) => <Badge color={getLocaleBadgeColor(t.locale)}>{t.locale.toUpperCase()}</Badge> },
    { key: "namespace", header: "Namespace", sortable: true, cell: (t: Translation) => <Text className="font-medium">{t.namespace}</Text> },
    { key: "key", header: "Key", sortable: true, cell: (t: Translation) => <Text className="font-mono text-sm">{t.key}</Text> },
    { key: "value", header: "Value", cell: (t: Translation) => <Text className="text-sm truncate max-w-[300px]">{t.value}</Text> },
    { key: "updated_at", header: "Updated", sortable: true, cell: (t: Translation) => new Date(t.updated_at).toLocaleDateString() },
    { key: "actions", header: "", width: "100px", cell: (t: Translation) => (
      <div className="flex gap-1">
        <Button variant="transparent" size="small" onClick={() => openEditDrawer(t)}><PencilSquare className="w-4 h-4" /></Button>
        <Button variant="transparent" size="small" onClick={() => setDeletingTranslation(t)}><Trash className="w-4 h-4 text-ui-tag-red-icon" /></Button>
      </div>
    )},
  ]

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div><Heading level="h1">Translations (i18n)</Heading><Text className="text-ui-fg-muted">Manage translations across locales and namespaces</Text></div>
          <Button onClick={() => setShowCreateDrawer(true)}><Plus className="w-4 h-4 mr-2" />Add Translation</Button>
        </div>
      </div>

      <div className="p-6"><StatsGrid stats={stats} columns={4} /></div>

      <div className="px-6 pb-6">
        <DataTable data={translations} columns={columns} searchable searchPlaceholder="Search translations..." searchKeys={["locale", "namespace", "key", "value"]} loading={isLoading} emptyMessage="No translations found" />
      </div>

      <FormDrawer
        open={showCreateDrawer || !!editingTranslation}
        onOpenChange={(open) => { if (!open) { setShowCreateDrawer(false); setEditingTranslation(null); resetForm() } }}
        title={editingTranslation ? "Edit Translation" : "Create Translation"}
        onSubmit={editingTranslation ? handleUpdate : handleCreate}
        submitLabel={editingTranslation ? "Update" : "Create"}
        loading={createTranslation.isPending || updateTranslation.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="locale">Locale</Label>
            <select id="locale" value={formData.locale} onChange={(e) => setFormData({ ...formData, locale: e.target.value as any })} className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base">
              {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
          <div><Label htmlFor="namespace">Namespace</Label><Input id="namespace" value={formData.namespace} onChange={(e) => setFormData({ ...formData, namespace: e.target.value as any })} placeholder="e.g. common, checkout, products" /></div>
          <div><Label htmlFor="key">Key</Label><Input id="key" value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value as any })} placeholder="e.g. button.submit" /></div>
          <div>
            <Label htmlFor="value">Value</Label>
            <textarea id="value" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value as any })} placeholder="Translation value" className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base min-h-[80px]" />
          </div>
        </div>
      </FormDrawer>

      <ConfirmModal open={!!deletingTranslation} onOpenChange={() => setDeletingTranslation(null)} title="Delete Translation" description={`Delete translation "${deletingTranslation?.key}" (${deletingTranslation?.locale})? This action cannot be undone.`} onConfirm={handleDelete} confirmLabel="Delete" variant="danger" loading={deleteTranslation.isPending} />
    </Container>
  )
}

export const config = defineRouteConfig({ label: "i18n", icon: EllipsisHorizontal })
export default I18nPage
