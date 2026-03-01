import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import crypto from "crypto";

const SKIP_PATHS = ["/health", "/store/health", "/admin/health"];

const SENSITIVE_FIELDS = new Set([
  "password",
  "token",
  "authorization",
  "card_number",
  "cvv",
  "secret",
]);

function redactSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveFields);
  }

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitiveFields(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export function requestLogger(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  if (SKIP_PATHS.some((p) => req.path === p || req.path.startsWith(p + "/"))) {
    return next();
  }

  const correlationId = crypto.randomUUID();
  res.setHeader("x-correlation-id", correlationId);

  const startTime = Date.now();
  const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown";

  let bodyLog: any = undefined;
  if (
    req.body &&
    typeof req.body === "object" &&
    Object.keys(req.body).length > 0
  ) {
    bodyLog = redactSensitiveFields(req.body);
  }

  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    const duration = Date.now() - startTime;
    const logEntry: Record<string, any> = {
      level: "info",
      type: "request",
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: duration,
      ip,
      timestamp: new Date().toISOString(),
    };
    if (bodyLog !== undefined) {
      logEntry.body = bodyLog;
    }
    console.log(JSON.stringify(logEntry));
    return originalEnd.apply(res, args);
  };

  next();
}
