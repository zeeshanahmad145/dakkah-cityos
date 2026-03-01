import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import crypto from "crypto";
import { appConfig } from "../config";
import { createLogger } from "../logger";
const logger = createLogger("middleware:request-logger");

function getClientIp(req: MedusaRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || "unknown";
}

export function requestLoggerMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const requestId =
    (req.headers["x-request-id"] as string) || crypto.randomUUID();
  const startTime = Date.now();

  res.setHeader("X-Request-ID", requestId);
  req.__requestId = requestId;
  req.__startTime = startTime;

  const originalEnd = res.end.bind(res);

  res.end = function (...args: any[]) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const skipPaths = ["/health", "/favicon.ico", "/__vite"];
    const shouldLog = !skipPaths.some((p) => req.path.startsWith(p));

    if (shouldLog) {
      const logData: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level:
          statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info",
        type: "http_request",
        request_id: requestId,
        method: req.method,
        path: req.path,
        status: statusCode,
        duration_ms: duration,
        ip: getClientIp(req),
        user_agent: req.headers["user-agent"]?.substring(0, 200),
      };

      const tenantId = req.tenant_id || req.headers["x-tenant-id"];
      if (tenantId) logData.tenant_id = tenantId;

      const userId = req.auth_context?.actor_id;
      if (userId) logData.user_id = userId;

      if (appConfig.isProduction) {
        if (statusCode >= 500) {
          logger.error(JSON.stringify(logData));
        } else if (statusCode >= 400) {
          logger.warn(JSON.stringify(logData));
        } else {
          logger.info(JSON.stringify(logData));
        }
      } else {
        const levelStr =
          statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARN" : "INFO";
        logger.info(
          `${logData.timestamp} ${levelStr} ${req.method} ${req.path} ${statusCode} ${duration}ms [${requestId.substring(0, 8)}]`,
        );
      }
    }

    return originalEnd(...args);
  };

  return next();
}
