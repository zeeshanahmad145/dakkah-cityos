import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { useToast } from "@/components/ui/toast"

interface FieldErrors {
  name?: string
  email?: string
  phone?: string
  tax_id?: string
  address_1?: string
  city?: string
  province?: string
  postal_code?: string
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidPhone = (phone: string): boolean => {
  if (!phone) return true
  const phoneRegex = /^[\d\s\-+()]{7,20}$/
  return phoneRegex.test(phone)
}

const isValidTaxId = (taxId: string): boolean => {
  if (!taxId) return true
  const einRegex = /^\d{2}-?\d{7}$/
  return einRegex.test(taxId)
}

const isValidPostalCode = (
  postalCode: string,
  countryCode: string,
): boolean => {
  if (!postalCode) return false
  switch (countryCode.toUpperCase()) {
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

const MAX_NAME_LENGTH = 100

export function CompanyRegistrationForm() {
  const navigate = useNavigate()
  const prefix = useTenantPrefix()
  const { addToast } = useToast()

  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    tax_id: "",
    email: "",
    phone: "",
    industry: "",
    employee_count: "",
    annual_revenue: "",
    billing_address: {
      address_1: "",
      city: "",
      province: "",
      postal_code: "",
      country_code: "us",
    },
  })

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Company name is required"
        if (value.length > MAX_NAME_LENGTH)
          return `Company name must be less than ${MAX_NAME_LENGTH} characters`
        break
      case "email":
        if (!value.trim()) return "Email is required"
        if (!isValidEmail(value)) return "Please enter a valid email address"
        break
      case "phone":
        if (value && !isValidPhone(value))
          return "Please enter a valid phone number"
        break
      case "tax_id":
        if (value && !isValidTaxId(value))
          return "Please enter a valid Tax ID (XX-XXXXXXX format)"
        break
      case "address_1":
        if (!value.trim()) return "Street address is required"
        break
      case "city":
        if (!value.trim()) return "City is required"
        break
      case "province":
        if (!value.trim()) return "State/Province is required"
        break
      case "postal_code":
        if (!value.trim()) return "Postal code is required"
        if (!isValidPostalCode(value, formData.billing_address.country_code)) {
          return "Please enter a valid postal code"
        }
        break
    }
    return undefined
  }

  const handleFieldBlur = (field: string, isAddress = false) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = isAddress
      ? formData.billing_address[field as keyof typeof formData.billing_address]
      : formData[field as keyof typeof formData]
    const error = validateField(field, value as string)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {}

    const nameError = validateField("name", formData.name)
    if (nameError) newErrors.name = nameError

    const emailError = validateField("email", formData.email)
    if (emailError) newErrors.email = emailError

    const phoneError = validateField("phone", formData.phone)
    if (phoneError) newErrors.phone = phoneError

    const taxIdError = validateField("tax_id", formData.tax_id)
    if (taxIdError) newErrors.tax_id = taxIdError

    const address1Error = validateField(
      "address_1",
      formData.billing_address.address_1,
    )
    if (address1Error) newErrors.address_1 = address1Error

    const cityError = validateField("city", formData.billing_address.city)
    if (cityError) newErrors.city = cityError

    const provinceError = validateField(
      "province",
      formData.billing_address.province,
    )
    if (provinceError) newErrors.province = provinceError

    const postalError = validateField(
      "postal_code",
      formData.billing_address.postal_code,
    )
    if (postalError) newErrors.postal_code = postalError

    setErrors(newErrors)
    setTouched({
      name: true,
      email: true,
      phone: true,
      tax_id: true,
      address_1: true,
      city: true,
      province: true,
      postal_code: true,
    })

    return Object.keys(newErrors).length === 0
  }

  const registerMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await sdk.client.fetch<{ company: unknown }>(
        "/store/companies",
        {
          method: "POST",
          credentials: "include",
          body: data,
        },
      )
      return response
    },
    onSuccess: () => {
      addToast("success", "Company registration submitted successfully!")
      navigate({ to: `${prefix}` })
    },
    onError: (err: Error) => {
      addToast(
        "error",
        err.message || "Failed to register company. Please try again.",
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      addToast("warning", "Please fix the errors before submitting")
      return
    }

    registerMutation.mutate(formData)
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  const updateAddressField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      billing_address: {
        ...prev.billing_address,
        [field]: value,
      },
    }))
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  const getFieldClass = (field: keyof FieldErrors) => {
    if (touched[field] && errors[field]) {
      return "border-ds-destructive focus:ring-ds-destructive"
    }
    return ""
  }

  const renderFieldError = (field: keyof FieldErrors) => {
    if (!touched[field] || !errors[field]) return null
    return <p className="text-sm text-ds-destructive mt-1">{errors[field]}</p>
  }

  return (
    <form
      aria-label="Company registration form"
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Company Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Company Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              onBlur={() => handleFieldBlur("name")}
              className={getFieldClass("name")}
              maxLength={MAX_NAME_LENGTH}
            />
            {renderFieldError("name")}
          </div>
          <div>
            <label htmlFor="legal_name" className="text-sm font-medium">
              Legal Name
            </label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => updateField("legal_name", e.target.value)}
              maxLength={MAX_NAME_LENGTH}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              className={getFieldClass("email")}
            />
            {renderFieldError("email")}
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              onBlur={() => handleFieldBlur("phone")}
              className={getFieldClass("phone")}
            />
            {renderFieldError("phone")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tax_id" className="text-sm font-medium">
              Tax ID / EIN
            </label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => updateField("tax_id", e.target.value)}
              onBlur={() => handleFieldBlur("tax_id")}
              className={getFieldClass("tax_id")}
              placeholder="XX-XXXXXXX"
            />
            {renderFieldError("tax_id")}
          </div>
          <div>
            <label htmlFor="industry" className="text-sm font-medium">
              Industry
            </label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => updateField("industry", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Billing Address</h2>

        <div>
          <label htmlFor="address" className="text-sm font-medium">
            Street Address *
          </label>
          <Input
            id="address"
            value={formData.billing_address.address_1}
            onChange={(e) => updateAddressField("address_1", e.target.value)}
            onBlur={() => handleFieldBlur("address_1", true)}
            className={getFieldClass("address_1")}
          />
          {renderFieldError("address_1")}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="text-sm font-medium">
              City *
            </label>
            <Input
              id="city"
              value={formData.billing_address.city}
              onChange={(e) => updateAddressField("city", e.target.value)}
              onBlur={() => handleFieldBlur("city", true)}
              className={getFieldClass("city")}
            />
            {renderFieldError("city")}
          </div>
          <div>
            <label htmlFor="province" className="text-sm font-medium">
              State / Province *
            </label>
            <Input
              id="province"
              value={formData.billing_address.province}
              onChange={(e) => updateAddressField("province", e.target.value)}
              onBlur={() => handleFieldBlur("province", true)}
              className={getFieldClass("province")}
            />
            {renderFieldError("province")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="postal_code" className="text-sm font-medium">
              Postal Code *
            </label>
            <Input
              id="postal_code"
              value={formData.billing_address.postal_code}
              onChange={(e) =>
                updateAddressField("postal_code", e.target.value)
              }
              onBlur={() => handleFieldBlur("postal_code", true)}
              className={getFieldClass("postal_code")}
            />
            {renderFieldError("postal_code")}
          </div>
          <div>
            <label htmlFor="country" className="text-sm font-medium">
              Country
            </label>
            <Input id="country" disabled value="United States" />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={registerMutation.isPending}
          className="flex-1"
        >
          {registerMutation.isPending ? "Submitting..." : "Register Company"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate({ to: `${prefix}` })}
        >
          Cancel
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Your account will be reviewed by our team. You'll receive an email once
        your B2B account is approved.
      </p>
    </form>
  )
}
