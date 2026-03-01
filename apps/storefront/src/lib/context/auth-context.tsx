import { sdk } from "@/lib/utils/sdk"
import { queryKeys } from "@/lib/utils/query-keys"
import { getBackendUrl } from "@/lib/utils/env"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react"

// Types
export interface Customer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  has_account: boolean
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
  // B2B fields
  company_id?: string
  company?: {
    id: string
    name: string
    credit_limit?: number
    spending_limit?: number
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}

export interface AuthContextType {
  customer: Customer | null
  isLoading: boolean
  isAuthenticated: boolean
  isB2B: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Customer>) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  refetch: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// Fetch current customer
async function fetchCurrentCustomer(): Promise<Customer | null> {
  try {
    const { customer } = await sdk.store.customer.retrieve()
    return customer as unknown as Customer
  } catch {
    return null
  }
}

const defaultAuthValue: AuthContextType = {
  customer: null,
  isLoading: true,
  isAuthenticated: false,
  isB2B: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  requestPasswordReset: async () => {},
  resetPassword: async () => {},
  refetch: () => {},
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <AuthContext.Provider value={defaultAuthValue}>
        {children}
      </AuthContext.Provider>
    )
  }

  return <ClientAuthProvider>{children}</ClientAuthProvider>
}

function ClientAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const {
    data: customer,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.customer.current(),
    queryFn: fetchCurrentCustomer,
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: isMounted,
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      await sdk.auth.login("customer", "emailpass", credentials)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customer.current() })
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      try {
        // First create the auth identity and get registration token
        await sdk.auth.register("customer", "emailpass", {
          email: data.email,
          password: data.password,
        })
      } catch (error: unknown) {
        // Handle "identity already exists" case - try to login instead
        if ((error instanceof Error && error.message?.includes("Identity with email already exists"))) {
          // Try to login with these credentials
          await sdk.auth.login("customer", "emailpass", {
            email: data.email,
            password: data.password,
          })
        } else {
          throw error
        }
      }

      // Create the customer profile using the auth/registration token
      const { customer } = await sdk.store.customer.create({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      })

      return customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customer.current() })
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await sdk.auth.logout()
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.customer.current(), null)
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
    },
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      const sanitized = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null)) as Parameters<typeof sdk.store.customer.update>[0]
      const { customer } = await sdk.store.customer.update(sanitized)
      return customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customer.current() })
    },
  })

  // Request password reset
  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      await sdk.auth.resetPassword("customer", "emailpass", {
        identifier: email,
      })
    },
  })

  // Reset password with token
  const resetPasswordMutation = useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string
      password: string
    }) => {
      // Use fetch directly for password update since SDK method signature varies
      const backendUrl = getBackendUrl()
      await fetch(`${backendUrl}/auth/customer/emailpass/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      })
    },
  })

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await loginMutation.mutateAsync(credentials)
    },
    [loginMutation],
  )

  const register = useCallback(
    async (data: RegisterData) => {
      await registerMutation.mutateAsync(data)
    },
    [registerMutation],
  )

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  const updateProfile = useCallback(
    async (data: Partial<Customer>) => {
      await updateProfileMutation.mutateAsync(data)
    },
    [updateProfileMutation],
  )

  const requestPasswordReset = useCallback(
    async (email: string) => {
      await requestPasswordResetMutation.mutateAsync(email)
    },
    [requestPasswordResetMutation],
  )

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      await resetPasswordMutation.mutateAsync({ token, password })
    },
    [resetPasswordMutation],
  )

  const value: AuthContextType = {
    customer: customer ?? null,
    isLoading,
    isAuthenticated: !!customer,
    isB2B: !!customer?.company_id,
    login,
    register,
    logout,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    refetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    return defaultAuthValue
  }
  return context
}

// Helper hook for protected content
export function useRequireAuth() {
  const auth = useAuth()
  return {
    ...auth,
    isReady: !auth.isLoading,
    shouldRedirect: !auth.isLoading && !auth.isAuthenticated,
  }
}
