import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SKIP_PATHS = ["/health", "/store/health", "/admin/health"]

export function requestLogger(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (SKIP_PATHS.some((p) => req.path === p || req.path.startsWith(p + "/"))) {
    return next()
  }

  const startTime = Date.now()
  const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown"

  const originalEnd = res.end
  res.end = function (...args: any[]) {
    const duration = Date.now() - startTime
    console.log(
      JSON.stringify({
        level: "info",
        type: "request",
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: duration,
        ip,
        timestamp: new Date().toISOString(),
      })
    )
    return originalEnd.apply(res, args)
  } as any

  next()
}
