import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { AccountLayout, AddressCard, AddressForm } from "@/components/account"
import { Button } from "@/components/ui/button"
import { Plus, MapPin } from "@medusajs/icons"
import { sdk } from "@/lib/utils/sdk"
import { t } from "@/lib/i18n"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export const Route = createFileRoute("/$tenant/$locale/account/addresses")({
  component: AddressesPage,
})

function AddressesPage() {
  const { locale } = Route.useParams() as { locale: string }
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", "addresses"],
    queryFn: async () => {
      const { customer } = await sdk.store.customer.retrieve({
        fields: "+addresses",
      })
      return customer
    },
  })

  const createAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      await sdk.store.customer.createAddress(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "addresses"] })
      setShowForm(false)
    },
  })

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await sdk.store.customer.updateAddress(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "addresses"] })
      setEditingAddress(null)
    },
  })

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      await sdk.store.customer.deleteAddress(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "addresses"] })
    },
  })

  const addresses = (customer as any)?.addresses || []

  return (
    <AccountLayout title={t(locale, "account.addresses_title", "Addresses")} description={t(locale, "account.addresses_description", "Manage your shipping and billing addresses")}>
      <div className="space-y-6">
        {/* Add Address Button */}
        {!showForm && !editingAddress && (
          <Button onClick={() => setShowForm(true)} size="fit">
            <Plus className="h-4 w-4 me-2" />
            Add new address
          </Button>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="bg-ds-background rounded-lg border border-ds-border p-6">
            <h2 className="text-lg font-semibold text-ds-foreground mb-6">Add New Address</h2>
            <AddressForm
              onSubmit={async (data) => {
                await createAddressMutation.mutateAsync(data)
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Edit Form */}
        {editingAddress && (
          <div className="bg-ds-background rounded-lg border border-ds-border p-6">
            <h2 className="text-lg font-semibold text-ds-foreground mb-6">Edit Address</h2>
            <AddressForm
              initialData={editingAddress}
              onSubmit={async (data) => {
                await updateAddressMutation.mutateAsync({ id: editingAddress.id, data })
              }}
              onCancel={() => setEditingAddress(null)}
              submitLabel={t(locale, "common.actions.update", "Update")}
            />
          </div>
        )}

        {/* Address List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-ds-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
            <MapPin className="h-12 w-12 text-ds-muted-foreground mx-auto mb-4" />
            <p className="text-ds-muted-foreground mb-4">No addresses saved yet</p>
            <Button onClick={() => setShowForm(true)} size="fit">
              <Plus className="h-4 w-4 me-2" />
              Add your first address
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address: any) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => setEditingAddress(address)}
                onDelete={() => {
                  if (confirm("Are you sure you want to delete this address?")) {
                    deleteAddressMutation.mutate(address.id)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
