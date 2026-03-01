import { useEffect, useState, type ReactNode } from "react"
import { useNavigate, useLocation } from "@tanstack/react-router"
import { useRequireAuth } from "@/lib/context/auth-context"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { Spinner } from "@medusajs/icons"

interface AuthGuardProps {
  children: ReactNode
  requireB2B?: boolean
  fallbackPath?: string
}

export function AuthGuard({
  children,
  requireB2B = false,
  fallbackPath,
}: AuthGuardProps) {
  const { isAuthenticated, isB2B, isLoading } = useRequireAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const prefix = useTenantPrefix()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || isLoading) return

    if (!isAuthenticated) {
      const redirectPath = fallbackPath || `${prefix}/login`
      navigate({
        to: redirectPath,
      })
      return
    }

    if (requireB2B && !isB2B) {
      navigate({ to: `${prefix}/account` })
    }
  }, [
    isMounted,
    isAuthenticated,
    isB2B,
    isLoading,
    requireB2B,
    navigate,
    location.pathname,
    prefix,
    fallbackPath,
  ])

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="w-8 h-8 animate-spin text-ds-muted-foreground mx-auto" />
          <p className="text-sm text-ds-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requireB2B && !isB2B) {
    return null
  }

  return <>{children}</>
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requireB2B?: boolean; fallbackPath?: string },
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard
        requireB2B={options?.requireB2B}
        fallbackPath={options?.fallbackPath}
      >
        <Component {...props} />
      </AuthGuard>
    )
  }
}
