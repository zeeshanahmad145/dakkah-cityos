import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { LoginForm } from "@/components/auth"
import { useAuth } from "@/lib/context/auth-context"
import { useEffect } from "react"
import { Link } from "@tanstack/react-router"

export const Route = createFileRoute("/$tenant/$locale/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login | Dakkah CityOS" },
      { name: "description", content: "Sign in to your Dakkah CityOS account" },
    ],
  }),
})

function LoginPage() {
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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ds-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-ds-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-ds-background border border-ds-border rounded-lg p-6 shadow-sm">
          <LoginForm
            onSuccess={handleSuccess}
            onForgotPassword={() =>
              navigate({ to: `${baseHref}/reset-password` })
            }
            onRegister={() => navigate({ to: `${baseHref}/register` })}
          />
        </div>

        <div className="mt-8 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ds-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-ds-muted text-ds-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link
              to={`${baseHref}/b2b/register` as never}
              className="flex items-center justify-center px-4 py-3 border border-ds-border rounded-lg hover:bg-ds-muted transition-colors"
            >
              <span className="text-sm font-medium text-ds-foreground">
                Business Account
              </span>
            </Link>
            <Link
              to={`${baseHref}/vendor/register` as never}
              className="flex items-center justify-center px-4 py-3 border border-ds-border rounded-lg hover:bg-ds-muted transition-colors"
            >
              <span className="text-sm font-medium text-ds-foreground">
                Become a Vendor
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
