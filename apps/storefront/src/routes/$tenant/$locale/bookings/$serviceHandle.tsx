import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { t } from "@/lib/i18n"
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import {
  useProviderAvailability,
  useCreateBooking,
} from "@/lib/hooks/use-bookings"
import {
  CalendarPicker,
  TimeSlotPicker,
  ProviderSelect,
} from "@/components/bookings"
import { useToast } from "@/components/ui/toast"

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function normalizeServiceDetail(raw: any) {
  const meta = typeof raw.metadata === "string" ? JSON.parse(raw.metadata) : raw.metadata || {}
  return {
    id: raw.id,
    name: raw.name || meta.name || "Untitled Service",
    handle: raw.handle || raw.product_id || raw.id,
    description: raw.description || meta.description || meta.short_description || "",
    duration: raw.duration ?? raw.duration_minutes ?? meta.duration ?? 60,
    buffer_time: raw.buffer_time ?? raw.buffer_before_minutes ?? 0,
    price: raw.price ?? meta.price ?? 0,
    currency_code: raw.currency_code || meta.currency_code || meta.currency || "USD",
    capacity: raw.capacity ?? raw.max_capacity ?? meta.capacity ?? 1,
    category_id: raw.category_id || meta.category || undefined,
    providers: raw.providers || [],
    images: raw.images || (meta.images ? meta.images.map((url: string) => ({ url })) : []),
    metadata: meta,
  }
}

export const Route = createFileRoute("/$tenant/$locale/bookings/$serviceHandle")({
  component: ServiceBookingPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.service?.name || "Booking Service"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.service?.description || "" },
    ],
  }),
  loader: async ({ params, abortController }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const headers = { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6" }
      const resp = await fetchWithTimeout(`${baseUrl}/store/bookings/services`, { headers, signal: abortController.signal })
      if (!resp.ok) return { service: null, providers: [] }
      const data = await resp.json()
      const services = (data.services || []).map(normalizeServiceDetail)
      const service = services.find(
        (s: any) => s.id === params.serviceHandle || s.handle === params.serviceHandle
      ) || null
      let providers: any[] = []
      if (service) {
        try {
          const provResp = await fetchWithTimeout(`${baseUrl}/store/bookings/services/${service.id}/providers`, { headers, signal: abortController.signal })
          if (provResp.ok) {
            const provData = await provResp.json()
            providers = provData.providers || []
          }
        } catch {}
      }
      return { service, providers }
    } catch { return { service: null, providers: [] } }
  },
})

const MAX_NOTES_LENGTH = 500

interface FormErrors {
  attendees?: string
  notes?: string
  date?: string
  provider?: string
  slot?: string
}

function ServiceBookingPage() {
  const { tenant, locale, serviceHandle } = Route.useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const loaderData = Route.useLoaderData()
  const service = loaderData?.service
  const serviceLoading = false
  const providers = loaderData?.providers || []
  const providersLoading = false
  const createBooking = useCreateBooking()

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [attendees, setAttendees] = useState(1)
  const [step, setStep] = useState<"provider" | "datetime" | "confirm">(
    "provider"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const {
    data: slots,
    isLoading: slotsLoading,
  } = useProviderAvailability(
    selectedProvider || "",
    selectedDate || "",
    service?.duration
  )

  const formatPrice = (amount: number | undefined | null, currency: string | undefined | null) => {
    const amt = typeof amount === "number" ? amount / 100 : 0
    const cur = (currency || "USD").toUpperCase()
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: cur,
        minimumFractionDigits: 0,
      }).format(amt)
    } catch {
      return `${cur} ${amt.toFixed(2)}`
    }
  }

  const formatDuration = (minutes: number | undefined | null) => {
    if (!minutes) return "1 hour"
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`
  }

  const selectedProviderData = useMemo(() => {
    return providers?.find((p) => p.id === selectedProvider)
  }, [providers, selectedProvider])

  const validateDate = (date: string): string | undefined => {
    const selectedDateObj = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDateObj < today) {
      return "Cannot book a date in the past"
    }
    return undefined
  }

  const validateAttendees = (count: number): string | undefined => {
    if (count < 1) {
      return "At least 1 attendee is required"
    }
    if (service?.capacity && count > service.capacity) {
      return `Maximum ${service.capacity} attendees allowed`
    }
    return undefined
  }

  const validateNotes = (notesText: string): string | undefined => {
    if (notesText.length > MAX_NOTES_LENGTH) {
      return `Notes must be less than ${MAX_NOTES_LENGTH} characters`
    }
    return undefined
  }

  const validateConfirmStep = (): boolean => {
    const newErrors: FormErrors = {}

    if (!selectedProvider) {
      newErrors.provider = "Please select a provider"
    }

    if (!selectedDate) {
      newErrors.date = "Please select a date"
    } else {
      const dateError = validateDate(selectedDate)
      if (dateError) newErrors.date = dateError
    }

    if (!selectedSlot) {
      newErrors.slot = "Please select a time slot"
    }

    const attendeesError = validateAttendees(attendees)
    if (attendeesError) newErrors.attendees = attendeesError

    const notesError = validateNotes(notes)
    if (notesError) newErrors.notes = notesError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId)
    setSelectedDate(null)
    setSelectedSlot(null)
    setErrors({})
    setStep("datetime")
  }

  const handleDateSelect = (date: string) => {
    const dateError = validateDate(date)
    if (dateError) {
      setErrors(prev => ({ ...prev, date: dateError }))
      addToast("warning", dateError)
      return
    }
    setSelectedDate(date)
    setSelectedSlot(null)
    setErrors(prev => ({ ...prev, date: undefined }))
  }

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot)
    setErrors(prev => ({ ...prev, slot: undefined }))
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    const notesError = validateNotes(value)
    setErrors(prev => ({ ...prev, notes: notesError }))
  }

  const handleAttendeesChange = (value: number) => {
    setAttendees(value)
    const attendeesError = validateAttendees(value)
    setErrors(prev => ({ ...prev, attendees: attendeesError }))
  }

  const handleContinueToConfirm = () => {
    if (!selectedProvider) {
      addToast("warning", "Please select a provider")
      return
    }
    if (!selectedDate) {
      addToast("warning", "Please select a date")
      return
    }
    if (!selectedSlot) {
      addToast("warning", "Please select a time slot")
      return
    }
    setStep("confirm")
  }

  const handleSubmit = async () => {
    if (!service || !selectedProvider || !selectedSlot) return

    if (!validateConfirmStep()) {
      addToast("warning", "Please fix the errors before confirming")
      return
    }

    setIsSubmitting(true)
    try {
      const booking = await createBooking.mutateAsync({
        service_id: service.id,
        provider_id: selectedProvider,
        start_time: selectedSlot,
        notes: notes.trim() || undefined,
        attendees,
      })

      addToast("success", "Booking confirmed successfully!")
      navigate({
        to: `/${tenant}/${locale}/bookings/confirmation`,
        search: { id: booking.id },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create booking"
      addToast("error", errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (serviceLoading) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <SpinnerIcon className="w-8 h-8 text-ds-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ds-foreground mb-2">
            Service Not Found
          </h1>
          <p className="text-ds-muted-foreground mb-6">
            The requested service could not be found.
          </p>
          <button
            onClick={() => navigate({ to: `/${tenant}/${locale}/bookings` })}
            className="btn-enterprise-primary"
          >
            View All Services
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-muted py-12">
      <div className="content-container max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => {
            if (step === "confirm") setStep("datetime")
            else if (step === "datetime") setStep("provider")
            else navigate({ to: `/${tenant}/${locale}/bookings` })
          }}
          className="flex items-center gap-2 text-ds-muted-foreground hover:text-ds-foreground mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          {step === "provider" ? t(locale, 'verticals.all_services') : "Back"}
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Service Header */}
            <div className="enterprise-card mb-6">
              <div className="enterprise-card-body">
                <div className="flex gap-4">
                  {service.images && service.images[0] && (
                    <img
                      src={service.images[0].url}
                      alt={service.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-ds-foreground mb-2">
                      {service.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {formatDuration(service.duration)}
                      </span>
                      {service.capacity && service.capacity > 1 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          Up to {service.capacity} attendees
                        </span>
                      )}
                    </div>
                    <p className="text-ds-muted-foreground mt-2">{service.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step: Provider Selection */}
            {step === "provider" && (
              <div className="enterprise-card">
                <div className="enterprise-card-header">
                  <h2 className="font-semibold text-ds-foreground">
                    Select a Provider
                  </h2>
                </div>
                <div className="enterprise-card-body">
                  {providersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <SpinnerIcon className="w-6 h-6 text-ds-muted-foreground animate-spin" />
                    </div>
                  ) : providers && providers.length > 0 ? (
                    <ProviderSelect
                      providers={providers}
                      selectedProvider={selectedProvider}
                      onProviderSelect={handleProviderSelect}
                    />
                  ) : (
                    <p className="text-center text-ds-muted-foreground py-8">
                      No providers available for this service.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step: Date & Time Selection */}
            {step === "datetime" && (
              <div className="enterprise-card">
                <div className="enterprise-card-header">
                  <h2 className="font-semibold text-ds-foreground">
                    Select Date & Time
                  </h2>
                </div>
                <div className="enterprise-card-body">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Calendar */}
                    <div>
                      <h3 className="text-sm font-medium text-ds-foreground mb-4">
                        Choose a Date
                      </h3>
                      <CalendarPicker
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                      />
                      {errors.date && (
                        <p className="text-sm text-ds-destructive mt-2">{errors.date}</p>
                      )}
                    </div>

                    {/* Time Slots */}
                    <div>
                      <h3 className="text-sm font-medium text-ds-foreground mb-4">
                        {selectedDate ? "Available Times" : "Select a date first"}
                      </h3>
                      {selectedDate ? (
                        <TimeSlotPicker
                          slots={slots || []}
                          selectedSlot={selectedSlot}
                          onSlotSelect={handleSlotSelect}
                          isLoading={slotsLoading}
                        />
                      ) : (
                        <div className="text-center py-8 text-ds-muted-foreground">
                          Select a date to see available times
                        </div>
                      )}
                      {errors.slot && (
                        <p className="text-sm text-ds-destructive mt-2">{errors.slot}</p>
                      )}
                    </div>
                  </div>

                  {/* Continue Button */}
                  {selectedSlot && (
                    <div className="mt-8 pt-6 border-t border-ds-border">
                      <button
                        onClick={handleContinueToConfirm}
                        className="w-full btn-enterprise-primary py-3"
                      >
                        Continue to Confirm
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step: Confirmation */}
            {step === "confirm" && (
              <div className="enterprise-card">
                <div className="enterprise-card-header">
                  <h2 className="font-semibold text-ds-foreground">
                    Confirm Your Booking
                  </h2>
                </div>
                <div className="enterprise-card-body space-y-6">
                  {/* Additional Options */}
                  {service.capacity && service.capacity > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-ds-foreground mb-2">
                        Number of Attendees
                      </label>
                      <select
                        value={attendees}
                        onChange={(e) => handleAttendeesChange(Number(e.target.value))}
                        className={`input-enterprise max-w-xs ${errors.attendees ? "border-ds-destructive" : ""}`}
                      >
                        {[...Array(service.capacity)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} {i === 0 ? "person" : "people"}
                          </option>
                        ))}
                      </select>
                      {errors.attendees && (
                        <p className="text-sm text-ds-destructive mt-1">{errors.attendees}</p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-ds-foreground mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder={t(locale, 'bookings.consultation_topics_placeholder')}
                      rows={3}
                      className={`input-enterprise resize-none ${errors.notes ? "border-ds-destructive" : ""}`}
                      maxLength={MAX_NOTES_LENGTH + 50}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.notes && (
                        <p className="text-sm text-ds-destructive">{errors.notes}</p>
                      )}
                      <span className={`text-sm ms-auto ${notes.length > MAX_NOTES_LENGTH ? "text-ds-destructive" : "text-ds-muted-foreground"}`}>
                        {notes.length}/{MAX_NOTES_LENGTH}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full btn-enterprise-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <SpinnerIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Confirm Booking -{" "}
                        {formatPrice(service.price, service.currency_code)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="enterprise-card sticky top-24">
              <div className="enterprise-card-header">
                <h3 className="font-semibold text-ds-foreground">Booking Summary</h3>
              </div>
              <div className="enterprise-card-body space-y-4">
                {/* Service */}
                <div className="flex justify-between">
                  <span className="text-ds-muted-foreground">Service</span>
                  <span className="font-medium text-ds-foreground">
                    {service.name}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex justify-between">
                  <span className="text-ds-muted-foreground">Duration</span>
                  <span className="text-ds-foreground">
                    {formatDuration(service.duration)}
                  </span>
                </div>

                {/* Provider */}
                {selectedProviderData && (
                  <div className="flex justify-between items-center">
                    <span className="text-ds-muted-foreground">Provider</span>
                    <span className="text-ds-foreground">
                      {selectedProviderData.name}
                    </span>
                  </div>
                )}

                {/* Date & Time */}
                {selectedDate && (
                  <div className="flex justify-between">
                    <span className="text-ds-muted-foreground">Date</span>
                    <span className="text-ds-foreground">
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {selectedSlot && (
                  <div className="flex justify-between">
                    <span className="text-ds-muted-foreground">Time</span>
                    <span className="text-ds-foreground">
                      {new Date(selectedSlot).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-ds-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-ds-foreground">Total</span>
                    <span className="text-xl font-bold text-ds-foreground">
                      {formatPrice(service.price, service.currency_code)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
