export class ApiError extends Error {
  status: number
  code: string
  details?: Record<string, any>

  constructor(message: string, status: number, code?: string, details?: Record<string, any>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code || "UNKNOWN_ERROR"
    this.details = details
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (response.ok || response.status < 500) {
        return response
      }

      lastError = new ApiError(
        `Server error: ${response.status}`,
        response.status,
        "SERVER_ERROR"
      )
    } catch (err: unknown) { lastError = err instanceof Error ? err : new Error(String(err))
    }

    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error("Request failed after retries")
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof Error) {
    if ((error instanceof Error ? error.message : String(error)).includes("fetch") || (error instanceof Error ? error.message : String(error)).includes("network")) {
      return new ApiError("Network error. Please check your connection.", 0, "NETWORK_ERROR")
    }
    return new ApiError((error instanceof Error ? error.message : String(error)), 500, "INTERNAL_ERROR")
  }

  return new ApiError("An unexpected error occurred", 500, "UNKNOWN_ERROR")
}

export function buildApiUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(path, baseUrl)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

export function parseApiResponse<T>(response: {
  data?: T
  items?: T
  error?: string
  message?: string
}): T {
  if (response.error || response.message) {
    throw new ApiError(
      response.error || response.message || "Unknown error",
      400,
      "API_ERROR"
    )
  }

  if (response.data !== undefined) {
    return response.data
  }

  if (response.items !== undefined) {
    return response.items
  }

  return response as unknown as T
}
