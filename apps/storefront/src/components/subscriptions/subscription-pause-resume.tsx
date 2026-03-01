import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { queryKeys } from "@/lib/utils/query-keys"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Subscription } from "@/lib/types/subscriptions"

interface SubscriptionPauseResumeProps {
  subscription: Subscription
}

export function SubscriptionPauseResume({ subscription }: SubscriptionPauseResumeProps) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState("")
  const [showPauseForm, setShowPauseForm] = useState(false)

  const pauseMutation = useMutation({
    mutationFn: async (data: { reason?: string; pause_end?: string }) => {
      return sdk.client.fetch(`/store/subscriptions/${subscription.id}/pause`, {
        method: "POST",
        credentials: "include",
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all })
      setShowPauseForm(false)
    },
  })

  const resumeMutation = useMutation({
    mutationFn: async () => {
      return sdk.client.fetch(`/store/subscriptions/${subscription.id}/resume`, {
        method: "POST",
        credentials: "include",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all })
    },
  })

  if (subscription.status === "paused") {
    return (
      <div className="border border-ds-warning bg-ds-warning rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-ds-warning">Subscription Paused</p>
            {subscription.pause_end && (
              <p className="text-sm text-ds-warning">
                Resumes: {new Date(subscription.pause_end!).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            onClick={() => resumeMutation.mutate()}
            disabled={resumeMutation.isPending}
          >
            {resumeMutation.isPending ? "Resuming..." : "Resume Now"}
          </Button>
        </div>
      </div>
    )
  }

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return null
  }

  if (!showPauseForm) {
    return (
      <Button variant="outline" onClick={() => setShowPauseForm(true)}>
        Pause Subscription
      </Button>
    )
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="font-medium">Pause Subscription</h4>
      <Input
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          onClick={() => pauseMutation.mutate({ reason: reason || undefined })}
          disabled={pauseMutation.isPending}
        >
          {pauseMutation.isPending ? "Pausing..." : "Confirm Pause"}
        </Button>
        <Button variant="outline" onClick={() => setShowPauseForm(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
