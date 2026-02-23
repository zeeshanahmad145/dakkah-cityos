import { Counter, Histogram, Registry, Gauge } from "prom-client";
import { appConfig } from "../lib/config";

class MetricsService {
  private registry: Registry;

  // HTTP Metrics
  public httpRequestDuration: Histogram;
  public httpRequestTotal: Counter;
  public httpRequestErrors: Counter;

  // Business Metrics
  public ordersTotal: Counter;
  public orderValue: Histogram;
  public subscriptionsMRR: Gauge;
  public activeVendors: Gauge;

  // Integration Metrics
  public integrationCalls: Counter;
  public integrationDuration: Histogram;
  public integrationErrors: Counter;

  // Database Metrics
  public dbQueryDuration: Histogram;
  public dbConnectionPool: Gauge;

  constructor() {
    this.registry = new Registry();

    // HTTP Metrics
    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code", "tenant_id"],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code", "tenant_id"],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: "http_request_errors_total",
      help: "Total number of HTTP request errors",
      labelNames: ["method", "route", "error_type", "tenant_id"],
      registers: [this.registry],
    });

    // Business Metrics
    this.ordersTotal = new Counter({
      name: "orders_total",
      help: "Total number of orders",
      labelNames: ["status", "tenant_id", "store_id"],
      registers: [this.registry],
    });

    this.orderValue = new Histogram({
      name: "order_value_usd",
      help: "Order value in USD",
      labelNames: ["tenant_id", "store_id"],
      buckets: [10, 50, 100, 500, 1000, 5000],
      registers: [this.registry],
    });

    this.subscriptionsMRR = new Gauge({
      name: "subscriptions_mrr_usd",
      help: "Monthly recurring revenue from subscriptions",
      labelNames: ["tenant_id"],
      registers: [this.registry],
    });

    this.activeVendors = new Gauge({
      name: "vendors_active_total",
      help: "Number of active vendors",
      labelNames: ["tenant_id"],
      registers: [this.registry],
    });

    // Integration Metrics
    this.integrationCalls = new Counter({
      name: "integration_calls_total",
      help: "Total number of integration calls",
      labelNames: ["integration", "operation", "status"],
      registers: [this.registry],
    });

    this.integrationDuration = new Histogram({
      name: "integration_duration_seconds",
      help: "Duration of integration calls",
      labelNames: ["integration", "operation"],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.integrationErrors = new Counter({
      name: "integration_errors_total",
      help: "Total number of integration errors",
      labelNames: ["integration", "operation", "error_type"],
      registers: [this.registry],
    });

    // Database Metrics
    this.dbQueryDuration = new Histogram({
      name: "db_query_duration_seconds",
      help: "Duration of database queries",
      labelNames: ["operation", "table"],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [this.registry],
    });

    this.dbConnectionPool = new Gauge({
      name: "db_connection_pool_size",
      help: "Current database connection pool size",
      labelNames: ["status"],
      registers: [this.registry],
    });

    // Collect default metrics (CPU, memory, etc.)
    this.registry.setDefaultLabels({
      app: "medusa-backend",
      environment: appConfig.nodeEnv,
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(data: {
    method: string;
    route: string;
    status_code: number;
    duration: number;
    tenant_id?: string;
  }) {
    this.httpRequestDuration
      .labels(
        data.method,
        data.route,
        data.status_code.toString(),
        data.tenant_id || "unknown"
      )
      .observe(data.duration);

    this.httpRequestTotal
      .labels(
        data.method,
        data.route,
        data.status_code.toString(),
        data.tenant_id || "unknown"
      )
      .inc();

    if (data.status_code >= 400) {
      this.httpRequestErrors
        .labels(
          data.method,
          data.route,
          data.status_code >= 500 ? "server_error" : "client_error",
          data.tenant_id || "unknown"
        )
        .inc();
    }
  }

  /**
   * Record order
   */
  recordOrder(data: {
    status: string;
    value_usd: number;
    tenant_id: string;
    store_id: string;
  }) {
    this.ordersTotal.labels(data.status, data.tenant_id, data.store_id).inc();
    this.orderValue.labels(data.tenant_id, data.store_id).observe(data.value_usd);
  }

  /**
   * Update MRR for tenant
   */
  updateMRR(tenant_id: string, mrr_usd: number) {
    this.subscriptionsMRR.labels(tenant_id).set(mrr_usd);
  }

  /**
   * Update active vendors count
   */
  updateActiveVendors(tenant_id: string, count: number) {
    this.activeVendors.labels(tenant_id).set(count);
  }

  /**
   * Record integration call
   */
  recordIntegration(data: {
    integration: string;
    operation: string;
    status: "success" | "error";
    duration: number;
    error_type?: string;
  }) {
    this.integrationCalls
      .labels(data.integration, data.operation, data.status)
      .inc();

    this.integrationDuration
      .labels(data.integration, data.operation)
      .observe(data.duration);

    if (data.status === "error" && data.error_type) {
      this.integrationErrors
        .labels(data.integration, data.operation, data.error_type)
        .inc();
    }
  }
}

export const metrics = new MetricsService();
