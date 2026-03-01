import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { sdk } from "@/lib/utils/sdk"
import { Button } from "@/components/ui/button"
import { CheckCircleSolid } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { useToast } from "@/components/ui/toast"

interface VendorRegistrationData {
  business_name: string
  legal_name?: string
  business_type: string
  tax_id?: string
  email: string
  phone?: string
  website?: string
  description?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country_code: string
  contact_person_name: string
  contact_person_email: string
  contact_person_phone?: string
}

interface FieldErrors {
  business_name?: string
  email?: string
  phone?: string
  website?: string
  tax_id?: string
  description?: string
  address_line1?: string
  city?: string
  state?: string
  postal_code?: string
  contact_person_name?: string
  contact_person_email?: string
  contact_person_phone?: string
  terms?: string
}

// Validation utilities
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidPhone = (phone: string): boolean => {
  if (!phone) return true // Optional field
  const phoneRegex = /^[\d\s\-+()]{7,20}$/
  return phoneRegex.test(phone)
}

const isValidUrl = (url: string): boolean => {
  if (!url) return true // Optional field
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const isValidTaxId = (taxId: string): boolean => {
  if (!taxId) return true // Optional field
  // US EIN format: XX-XXXXXXX
  const einRegex = /^\d{2}-?\d{7}$/
  return einRegex.test(taxId)
}

const isValidPostalCode = (
  postalCode: string,
  countryCode: string,
): boolean => {
  if (!postalCode) return false
  switch (countryCode) {
    case "US":
      return /^\d{5}(-\d{4})?$/.test(postalCode)
    case "CA":
      return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(postalCode)
    case "GB":
      return /^[A-Za-z]{1,2}\d[A-Za-z\d]?[ ]?\d[A-Za-z]{2}$/.test(postalCode)
    default:
      return postalCode.length >= 3
  }
}

const MAX_DESCRIPTION_LENGTH = 1000
const MAX_NAME_LENGTH = 100

export function VendorRegistrationForm() {
  const navigate = useNavigate()
  const prefix = useTenantPrefix()
  const { addToast } = useToast()

  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [formData, setFormData] = useState<VendorRegistrationData>({
    business_name: "",
    legal_name: "",
    business_type: "individual",
    tax_id: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: "US",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_phone: "",
  })

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case "business_name":
        if (!value.trim()) return "Business name is required"
        if (value.length > MAX_NAME_LENGTH)
          return `Business name must be less than ${MAX_NAME_LENGTH} characters`
        break
      case "email":
        if (!value.trim()) return "Email is required"
        if (!isValidEmail(value)) return "Please enter a valid email address"
        break
      case "phone":
        if (value && !isValidPhone(value))
          return "Please enter a valid phone number"
        break
      case "website":
        if (value && !isValidUrl(value))
          return "Please enter a valid URL (e.g., https://example.com)"
        break
      case "tax_id":
        if (value && !isValidTaxId(value))
          return "Please enter a valid Tax ID (XX-XXXXXXX format)"
        break
      case "description":
        if (value && value.length > MAX_DESCRIPTION_LENGTH)
          return `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`
        break
      case "address_line1":
        if (!value.trim()) return "Street address is required"
        break
      case "city":
        if (!value.trim()) return "City is required"
        break
      case "state":
        if (!value.trim()) return "State/Province is required"
        break
      case "postal_code":
        if (!value.trim()) return "Postal code is required"
        if (!isValidPostalCode(value, formData.country_code))
          return "Please enter a valid postal code"
        break
      case "contact_person_name":
        if (!value.trim()) return "Contact name is required"
        if (value.length > MAX_NAME_LENGTH)
          return `Name must be less than ${MAX_NAME_LENGTH} characters`
        break
      case "contact_person_email":
        if (!value.trim()) return "Contact email is required"
        if (!isValidEmail(value)) return "Please enter a valid email address"
        break
      case "contact_person_phone":
        if (value && !isValidPhone(value))
          return "Please enter a valid phone number"
        break
    }
    return undefined
  }

  const handleFieldChange = (
    field: keyof VendorRegistrationData,
    value: string,
  ) => {
    setFormData({ ...formData, [field]: value })
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = formData[field as keyof VendorRegistrationData] || ""
    const error = validateField(field, value as string)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const validateStep1 = (): boolean => {
    const newErrors: FieldErrors = {}

    const businessNameError = validateField(
      "business_name",
      formData.business_name,
    )
    if (businessNameError) newErrors.business_name = businessNameError

    const emailError = validateField("email", formData.email)
    if (emailError) newErrors.email = emailError

    const phoneError = validateField("phone", formData.phone || "")
    if (phoneError) newErrors.phone = phoneError

    const websiteError = validateField("website", formData.website || "")
    if (websiteError) newErrors.website = websiteError

    const taxIdError = validateField("tax_id", formData.tax_id || "")
    if (taxIdError) newErrors.tax_id = taxIdError

    const descriptionError = validateField(
      "description",
      formData.description || "",
    )
    if (descriptionError) newErrors.description = descriptionError

    setErrors((prev) => ({ ...prev, ...newErrors }))
    setTouched((prev) => ({
      ...prev,
      business_name: true,
      email: true,
      phone: true,
      website: true,
      tax_id: true,
      description: true,
    }))

    return !Object.values(newErrors).some(Boolean)
  }

  const validateStep2 = (): boolean => {
    const newErrors: FieldErrors = {}

    const address1Error = validateField("address_line1", formData.address_line1)
    if (address1Error) newErrors.address_line1 = address1Error

    const cityError = validateField("city", formData.city)
    if (cityError) newErrors.city = cityError

    const stateError = validateField("state", formData.state)
    if (stateError) newErrors.state = stateError

    const postalError = validateField("postal_code", formData.postal_code)
    if (postalError) newErrors.postal_code = postalError

    setErrors((prev) => ({ ...prev, ...newErrors }))
    setTouched((prev) => ({
      ...prev,
      address_line1: true,
      city: true,
      state: true,
      postal_code: true,
    }))

    return !Object.values(newErrors).some(Boolean)
  }

  const validateStep3 = (): boolean => {
    const newErrors: FieldErrors = {}

    const nameError = validateField(
      "contact_person_name",
      formData.contact_person_name,
    )
    if (nameError) newErrors.contact_person_name = nameError

    const emailError = validateField(
      "contact_person_email",
      formData.contact_person_email,
    )
    if (emailError) newErrors.contact_person_email = emailError

    const phoneError = validateField(
      "contact_person_phone",
      formData.contact_person_phone || "",
    )
    if (phoneError) newErrors.contact_person_phone = phoneError

    if (!termsAccepted) {
      newErrors.terms = "You must accept the terms to continue"
    }

    setErrors((prev) => ({ ...prev, ...newErrors }))
    setTouched((prev) => ({
      ...prev,
      contact_person_name: true,
      contact_person_email: true,
      contact_person_phone: true,
    }))

    return !Object.values(newErrors).some(Boolean)
  }

  const registerMutation = useMutation({
    mutationFn: async (data: VendorRegistrationData) => {
      return sdk.client.fetch("/store/vendors/register", {
        method: "POST",
        body: data,
        credentials: "include",
      })
    },
    onSuccess: () => {
      setSubmitted(true)
      addToast("success", "Application submitted successfully!")
    },
    onError: (err: Error) => {
      addToast(
        "error",
        err.message || "Failed to submit application. Please try again.",
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep3()) {
      return
    }

    registerMutation.mutate(formData)
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) {
      addToast("warning", "Please fix the errors before continuing")
      return
    }
    if (step === 2 && !validateStep2()) {
      addToast("warning", "Please fix the errors before continuing")
      return
    }
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const renderFieldError = (field: keyof FieldErrors) => {
    if (!touched[field] || !errors[field]) return null
    return <p className="text-sm text-ds-destructive mt-1">{errors[field]}</p>
  }

  const getFieldClass = (field: keyof FieldErrors) => {
    const base = "w-full px-3 py-2 border rounded-md"
    if (touched[field] && errors[field]) {
      return `${base} border-ds-destructive focus:ring-ds-destructive`
    }
    return base
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <CheckCircleSolid className="w-16 h-16 text-ds-success mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Application Submitted</h2>
        <p className="text-muted-foreground mb-6">
          Thank you for applying to become a vendor! We will review your
          application and get back to you within 2-3 business days.
        </p>
        <Button onClick={() => navigate({ to: `${prefix}/store` })}>
          Return to Store
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Become a Vendor</h1>
      <p className="text-muted-foreground mb-8">
        Join our marketplace and start selling your products
      </p>

      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  s < step ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form aria-label="Vendor registration form" onSubmit={handleSubmit}>
        {/* Step 1: Business Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Business Information</h2>

            <div>
              <label className="block text-sm font-medium mb-1">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) =>
                  handleFieldChange("business_name", e.target.value)
                }
                onBlur={() => handleFieldBlur("business_name")}
                className={getFieldClass("business_name")}
                placeholder="Your business name"
                maxLength={MAX_NAME_LENGTH}
              />
              {renderFieldError("business_name")}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Legal Name
              </label>
              <input
                type="text"
                value={formData.legal_name || ""}
                onChange={(e) =>
                  handleFieldChange("legal_name", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Legal entity name (if different)"
                maxLength={MAX_NAME_LENGTH}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Business Type
              </label>
              <select
                value={formData.business_type}
                onChange={(e) =>
                  handleFieldChange("business_type", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="individual">Individual / Sole Proprietor</option>
                <option value="llc">LLC</option>
                <option value="corporation">Corporation</option>
                <option value="partnership">Partnership</option>
                <option value="nonprofit">Non-Profit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tax ID / EIN
              </label>
              <input
                type="text"
                value={formData.tax_id || ""}
                onChange={(e) => handleFieldChange("tax_id", e.target.value)}
                onBlur={() => handleFieldBlur("tax_id")}
                className={getFieldClass("tax_id")}
                placeholder="XX-XXXXXXX"
              />
              {renderFieldError("tax_id")}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={() => handleFieldBlur("email")}
                  className={getFieldClass("email")}
                  placeholder="business@example.com"
                />
                {renderFieldError("email")}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  onBlur={() => handleFieldBlur("phone")}
                  className={getFieldClass("phone")}
                  placeholder="+1 (555) 000-0000"
                />
                {renderFieldError("phone")}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                value={formData.website || ""}
                onChange={(e) => handleFieldChange("website", e.target.value)}
                onBlur={() => handleFieldBlur("website")}
                className={getFieldClass("website")}
                placeholder="https://www.example.com"
              />
              {renderFieldError("website")}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Business Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                onBlur={() => handleFieldBlur("description")}
                className={`${getFieldClass("description")} min-h-[100px]`}
                placeholder="Tell us about your business and products"
                maxLength={MAX_DESCRIPTION_LENGTH + 100}
              />
              <div className="flex justify-between mt-1">
                {renderFieldError("description")}
                <span
                  className={`text-sm ms-auto ${(formData.description?.length || 0) > MAX_DESCRIPTION_LENGTH ? "text-ds-destructive" : "text-muted-foreground"}`}
                >
                  {formData.description?.length || 0}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={nextStep}>
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Business Address</h2>

            <div>
              <label className="block text-sm font-medium mb-1">
                Street Address *
              </label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) =>
                  handleFieldChange("address_line1", e.target.value)
                }
                onBlur={() => handleFieldBlur("address_line1")}
                className={getFieldClass("address_line1")}
                placeholder="123 Main St"
              />
              {renderFieldError("address_line1")}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address_line2 || ""}
                onChange={(e) =>
                  handleFieldChange("address_line2", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Suite, Unit, Building, Floor, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  onBlur={() => handleFieldBlur("city")}
                  className={getFieldClass("city")}
                />
                {renderFieldError("city")}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  State / Province *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleFieldChange("state", e.target.value)}
                  onBlur={() => handleFieldBlur("state")}
                  className={getFieldClass("state")}
                />
                {renderFieldError("state")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) =>
                    handleFieldChange("postal_code", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("postal_code")}
                  className={getFieldClass("postal_code")}
                />
                {renderFieldError("postal_code")}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Country
                </label>
                <select
                  value={formData.country_code}
                  onChange={(e) =>
                    handleFieldChange("country_code", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={prevStep}>
                Previous
              </Button>
              <Button type="button" onClick={nextStep}>
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Person */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Contact Person</h2>
            <p className="text-muted-foreground">
              Who should we contact regarding your vendor account?
            </p>

            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.contact_person_name}
                onChange={(e) =>
                  handleFieldChange("contact_person_name", e.target.value)
                }
                onBlur={() => handleFieldBlur("contact_person_name")}
                className={getFieldClass("contact_person_name")}
                placeholder="John Doe"
                maxLength={MAX_NAME_LENGTH}
              />
              {renderFieldError("contact_person_name")}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={formData.contact_person_email}
                onChange={(e) =>
                  handleFieldChange("contact_person_email", e.target.value)
                }
                onBlur={() => handleFieldBlur("contact_person_email")}
                className={getFieldClass("contact_person_email")}
                placeholder="john@example.com"
              />
              {renderFieldError("contact_person_email")}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.contact_person_phone || ""}
                onChange={(e) =>
                  handleFieldChange("contact_person_phone", e.target.value)
                }
                onBlur={() => handleFieldBlur("contact_person_phone")}
                className={getFieldClass("contact_person_phone")}
                placeholder="+1 (555) 000-0000"
              />
              {renderFieldError("contact_person_phone")}
            </div>

            {/* Terms Agreement */}
            <div
              className={`border rounded-lg p-4 ${errors.terms ? "border-ds-destructive bg-ds-destructive" : "bg-muted/20"}`}
            >
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (e.target.checked) {
                      setErrors((prev) => ({ ...prev, terms: undefined }))
                    }
                  }}
                  className="mt-1 rounded"
                />
                <span className="text-sm">
                  I agree to the Vendor Terms of Service and understand that my
                  application will be reviewed before I can start selling. I
                  confirm that all information provided is accurate and
                  complete.
                </span>
              </label>
              {errors.terms && (
                <p className="text-sm text-ds-destructive mt-2">
                  {errors.terms}
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={prevStep}>
                Previous
              </Button>
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending
                  ? "Submitting..."
                  : "Submit Application"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
