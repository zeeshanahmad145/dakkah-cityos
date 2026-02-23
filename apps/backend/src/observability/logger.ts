import winston from "winston";
import { Format } from "logform";
import { appConfig } from "../lib/config";

export interface LogContext {
  tenant_id?: string;
  user_id?: string;
  request_id?: string;
  session_id?: string;
  [key: string]: any;
}

class Logger {
  private logger: winston.Logger;

  constructor() {
    const formats: Format[] = [
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ];

    // Add JSON format for production
    if (appConfig.isProduction) {
      formats.push(winston.format.json());
    } else {
      // Pretty print for development
      formats.push(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta, null, 2)}`;
          }
          return msg;
        })
      );
    }

    this.logger = winston.createLogger({
      level: appConfig.logLevel || "info",
      format: winston.format.combine(...formats),
      defaultMeta: {
        service: "medusa-backend",
        environment: appConfig.nodeEnv,
      },
      transports: [
        new winston.transports.Console(),
        // Add file transport for production
        ...(appConfig.isProduction
          ? [
              new winston.transports.File({
                filename: "logs/error.log",
                level: "error",
              }),
              new winston.transports.File({ filename: "logs/combined.log" }),
            ]
          : []),
      ],
    });
  }

  info(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.logger.error(message, {
      ...context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  /**
   * Log HTTP request
   */
  logRequest(data: {
    method: string;
    url: string;
    status: number;
    duration: number;
    tenant_id?: string;
    user_id?: string;
  }) {
    this.info("HTTP Request", {
      type: "http_request",
      ...data,
    });
  }

  /**
   * Log database query
   */
  logQuery(data: {
    query: string;
    duration: number;
    tenant_id?: string;
  }) {
    this.debug("Database Query", {
      type: "db_query",
      ...data,
    });
  }

  /**
   * Log workflow execution
   */
  logWorkflow(data: {
    workflow: string;
    status: "started" | "completed" | "failed";
    duration?: number;
    error?: Error;
    tenant_id?: string;
  }) {
    if (data.status === "failed") {
      this.error(`Workflow failed: ${data.workflow}`, data.error, {
        type: "workflow",
        workflow: data.workflow,
        status: data.status,
        duration: data.duration,
        tenant_id: data.tenant_id,
      });
    } else {
      this.info(`Workflow ${data.status}: ${data.workflow}`, {
        type: "workflow",
        ...data,
      });
    }
  }

  /**
   * Log integration call
   */
  logIntegration(data: {
    integration: string;
    action: string;
    status: "success" | "failed";
    duration: number;
    error?: Error;
    tenant_id?: string;
  }) {
    if (data.status === "failed") {
      this.error(
        `Integration failed: ${data.integration}.${data.action}`,
        data.error,
        {
          type: "integration",
          integration: data.integration,
          action: data.action,
          duration: data.duration,
          tenant_id: data.tenant_id,
        }
      );
    } else {
      this.info(`Integration call: ${data.integration}.${data.action}`, {
        type: "integration",
        ...data,
      });
    }
  }
}

export const logger = new Logger();
