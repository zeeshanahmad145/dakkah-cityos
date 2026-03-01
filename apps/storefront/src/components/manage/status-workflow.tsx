import React, { useState } from 'react'

export interface StatusTransition {
  from: string
  to: string
  label: string
  confirmRequired?: boolean
}

interface StatusHistoryEntry {
  from: string
  to: string
  timestamp: string
  note?: string
  user?: string
}

interface StatusWorkflowProps {
  currentStatus: string
  availableTransitions: StatusTransition[]
  onTransition: (to: string, note?: string) => void
  entityType: string
  statusHistory?: StatusHistoryEntry[]
}

const statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-ds-warning/15', text: 'text-ds-warning', dot: 'bg-ds-warning' },
  processing: { bg: 'bg-ds-warning/15', text: 'text-ds-warning', dot: 'bg-ds-warning' },
  in_progress: { bg: 'bg-ds-warning/15', text: 'text-ds-warning', dot: 'bg-ds-warning' },
  review: { bg: 'bg-ds-info/15', text: 'text-ds-info', dot: 'bg-ds-info' },
  active: { bg: 'bg-ds-success/15', text: 'text-ds-success', dot: 'bg-ds-success' },
  approved: { bg: 'bg-ds-success/15', text: 'text-ds-success', dot: 'bg-ds-success' },
  confirmed: { bg: 'bg-ds-success/15', text: 'text-ds-success', dot: 'bg-ds-success' },
  completed: { bg: 'bg-ds-success/15', text: 'text-ds-success', dot: 'bg-ds-success' },
  delivered: { bg: 'bg-ds-success/15', text: 'text-ds-success', dot: 'bg-ds-success' },
  published: { bg: 'bg-ds-success/15', text: 'text-ds-success', dot: 'bg-ds-success' },
  shipped: { bg: 'bg-ds-info/15', text: 'text-ds-info', dot: 'bg-ds-info' },
  draft: { bg: 'bg-ds-muted', text: 'text-ds-muted-foreground', dot: 'bg-ds-muted-foreground/70' },
  archived: { bg: 'bg-ds-muted', text: 'text-ds-muted-foreground', dot: 'bg-ds-muted-foreground/70' },
  cancelled: { bg: 'bg-ds-destructive/15', text: 'text-ds-destructive', dot: 'bg-ds-destructive' },
  rejected: { bg: 'bg-ds-destructive/15', text: 'text-ds-destructive', dot: 'bg-ds-destructive' },
  suspended: { bg: 'bg-ds-destructive/15', text: 'text-ds-destructive', dot: 'bg-ds-destructive' },
}

const defaultColor = { bg: 'bg-ds-muted', text: 'text-ds-muted-foreground', dot: 'bg-ds-muted-foreground/70' }

export const commonTransitions: Record<string, StatusTransition[]> = {
  order: [
    { from: 'pending', to: 'processing', label: 'Start Processing' },
    { from: 'processing', to: 'shipped', label: 'Mark Shipped' },
    { from: 'shipped', to: 'delivered', label: 'Mark Delivered' },
    { from: 'pending', to: 'cancelled', label: 'Cancel Order', confirmRequired: true },
    { from: 'processing', to: 'cancelled', label: 'Cancel Order', confirmRequired: true },
  ],
  vendor: [
    { from: 'pending', to: 'approved', label: 'Approve' },
    { from: 'approved', to: 'active', label: 'Activate' },
    { from: 'pending', to: 'rejected', label: 'Reject', confirmRequired: true },
    { from: 'active', to: 'suspended', label: 'Suspend', confirmRequired: true },
  ],
  content: [
    { from: 'draft', to: 'review', label: 'Submit for Review' },
    { from: 'review', to: 'published', label: 'Publish' },
    { from: 'draft', to: 'archived', label: 'Archive' },
    { from: 'published', to: 'archived', label: 'Archive' },
    { from: 'review', to: 'draft', label: 'Return to Draft' },
  ],
  booking: [
    { from: 'pending', to: 'confirmed', label: 'Confirm' },
    { from: 'confirmed', to: 'completed', label: 'Complete' },
    { from: 'pending', to: 'cancelled', label: 'Cancel', confirmRequired: true },
    { from: 'confirmed', to: 'cancelled', label: 'Cancel', confirmRequired: true },
  ],
}

function getStatusColor(status: string) {
  const normalized = status.toLowerCase().replace(/[\s-]/g, '_')
  return statusColorMap[normalized] || defaultColor
}

function formatStatus(status: string): string {
  return status.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function StatusWorkflow({
  currentStatus,
  availableTransitions,
  onTransition,
  entityType,
  statusHistory = [],
}: StatusWorkflowProps) {
  const [confirmingTransition, setConfirmingTransition] = useState<StatusTransition | null>(null)
  const [note, setNote] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const validTransitions = availableTransitions.filter(
    (t) => t.from.toLowerCase() === currentStatus.toLowerCase()
  )

  const color = getStatusColor(currentStatus)

  const handleTransition = (transition: StatusTransition) => {
    if (transition.confirmRequired) {
      setConfirmingTransition(transition)
    } else {
      onTransition(transition.to)
    }
  }

  const confirmTransition = () => {
    if (confirmingTransition) {
      onTransition(confirmingTransition.to, note || undefined)
      setConfirmingTransition(null)
      setNote('')
    }
  }

  const mockHistory: StatusHistoryEntry[] =
    statusHistory.length > 0
      ? statusHistory
      : [
          { from: 'created', to: currentStatus, timestamp: new Date().toISOString(), user: 'System' },
        ]

  return (
    <div className="bg-ds-card border border-ds-border rounded-lg p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ds-foreground">
          {formatStatus(entityType)} Status
        </h3>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${color.bg} ${color.text}`}>
          <span className={`w-2 h-2 rounded-full ${color.dot}`} />
          {formatStatus(currentStatus)}
        </span>
      </div>

      {validTransitions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
            Available Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {validTransitions.map((transition) => {
              const targetColor = getStatusColor(transition.to)
              const isDestructive = ['cancelled', 'rejected', 'suspended'].includes(
                transition.to.toLowerCase()
              )
              return (
                <button
                  key={`${transition.from}-${transition.to}`}
                  type="button"
                  onClick={() => handleTransition(transition)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isDestructive
                      ? 'bg-ds-destructive/10 text-ds-destructive hover:bg-ds-destructive/20'
                      : 'bg-ds-primary/10 text-ds-primary hover:bg-ds-primary/20'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  {transition.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="border-t border-ds-border pt-4">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 text-sm text-ds-muted-foreground hover:text-ds-foreground transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Status History ({mockHistory.length})
        </button>

        {showHistory && (
          <div className="mt-3 space-y-0">
            {mockHistory.map((entry, i) => {
              const toColor = getStatusColor(entry.to)
              return (
                <div key={i} className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 border-white ${toColor.dot} z-10`} />
                    {i < mockHistory.length - 1 && (
                      <div className="w-px flex-1 bg-ds-border" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-ds-foreground">
                      <span className="font-medium">{formatStatus(entry.from)}</span>
                      {' → '}
                      <span className="font-medium">{formatStatus(entry.to)}</span>
                    </p>
                    <p className="text-xs text-ds-muted-foreground mt-0.5">
                      {new Date(entry.timestamp!).toLocaleString()}
                      {entry.user && ` · ${entry.user}`}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-ds-muted-foreground mt-1 italic">
                        "{entry.note}"
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {confirmingTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setConfirmingTransition(null)
              setNote('')
            }}
          />
          <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-ds-foreground">
              Confirm: {confirmingTransition.label}
            </h2>
            <p className="mt-2 text-sm text-ds-muted-foreground">
              This will change the status from{' '}
              <span className="font-medium">{formatStatus(confirmingTransition.from)}</span> to{' '}
              <span className="font-medium">{formatStatus(confirmingTransition.to)}</span>.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-ds-foreground mb-1.5">
                Notes (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this transition..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-ds-background border border-ds-border rounded-md text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary resize-none"
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmingTransition(null)
                  setNote('')
                }}
                className="px-3 py-2 text-sm font-medium border border-ds-border rounded-md text-ds-foreground hover:bg-ds-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTransition}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  ['cancelled', 'rejected', 'suspended'].includes(confirmingTransition.to.toLowerCase())
                    ? 'bg-ds-destructive text-ds-primary-foreground hover:opacity-90'
                    : 'bg-ds-primary text-ds-primary-foreground hover:opacity-90'
                }`}
              >
                {confirmingTransition.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
