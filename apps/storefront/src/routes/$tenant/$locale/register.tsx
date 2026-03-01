import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { RegisterForm } from "@/components/auth"
import { useAuth } from "@/lib/context/auth-context"
import { useEffect } from "react"
import { Link } from "@tanstack/react-router"

export const Route = createFileRoute("/$tenant/$locale/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Register | Dakkah CityOS" },
      { name: "description", content: "Create your account on Dakkah CityOS" },
    ],
  }),
})

function RegisterPage() {
  const { tenant, locale } = Route.useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const baseHref = `/${tenant}/${locale}`

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: `${baseHref}/account` })
    }
  }, [isAuthenticated, isLoading, navigate, baseHref])

  const handleSuccess = () => {
    navigate({ to: `${baseHref}/account` })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-ds-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ds-foreground">
            Create an account
          </h1>
          <p className="mt-2 text-ds-muted-foreground">
            Get started with your free account today
          </p>
        </div>

        <div className="bg-ds-background border border-ds-border rounded-lg p-6 shadow-sm">
          <RegisterForm
            onSuccess={handleSuccess}
            onLogin={() => navigate({ to: `${baseHref}/login` })}
          />
        </div>

        <div className="mt-8 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ds-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-ds-muted text-ds-muted-foreground">
                Looking for something else?
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link
              to={`${baseHref}/b2b/register` as never}
              className="flex flex-col items-center justify-center px-4 py-4 border border-ds-border rounded-lg hover:bg-ds-muted transition-colors"
            >
              <span className="text-sm font-medium text-ds-foreground">
                Business Account
              </span>
              <span className="text-xs text-ds-muted-foreground mt-1">
                For companies
              </span>
            </Link>
            <Link
              to={`${baseHref}/vendor/register` as never}
              className="flex flex-col items-center justify-center px-4 py-4 border border-ds-border rounded-lg hover:bg-ds-muted transition-colors"
            >
              <span className="text-sm font-medium text-ds-foreground">
                Vendor Account
              </span>
              <span className="text-xs text-ds-muted-foreground mt-1">
                Sell on our platform
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
