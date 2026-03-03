/**
 * Type declaration shim for @temporalio/workflow.
 * Allows the canonical-workflows.ts file to typecheck without the Temporal
 * SDK being physically installed in the backend package.
 *
 * When you install the real SDK:
 *   npm install @temporalio/client @temporalio/worker @temporalio/workflow
 * this file becomes a no-op (real types win).
 */
declare module "@temporalio/workflow" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function proxyActivities<T = Record<string, (...args: any[]) => any>>(
    options: Record<string, unknown>,
  ): T;

  export function sleep(ms: string | number): Promise<void>;

  export function condition(
    fn: () => boolean,
    timeout?: string | number,
  ): Promise<boolean>;

  export function defineSignal<T extends unknown[] = []>(
    name: string,
  ): { name: string };

  export function setHandler(
    signal: { name: string },
    handler: (...args: any[]) => void,
  ): void;

  export function continueAsNew<F extends (...args: any[]) => Promise<void>>(
    ...args: Parameters<F>
  ): Promise<never>;

  export class ApplicationFailure extends Error {
    static create(opts: {
      message?: string;
      type?: string;
      nonRetryable?: boolean;
    }): ApplicationFailure;
  }

  export class ActivityFailure extends Error {}
}

declare module "@temporalio/client" {
  interface TLSConfig {
    serverName?: string;
    clientCertPair?: { crt: Buffer; key: Buffer };
  }
  interface ConnectionOptions {
    address?: string;
    tls?: TLSConfig | boolean;
    apiKey?: string;
    identity?: string;
  }

  export class Connection {
    static connect(opts?: ConnectionOptions): Promise<Connection>;
    close(): Promise<void>;
  }

  export class Client {
    constructor(opts?: { connection?: Connection; namespace?: string });
    workflow: {
      start(
        fn: string | ((...args: any[]) => any),
        opts: Record<string, unknown>,
      ): Promise<{ workflowId: string }>;
    };
  }

  export class WorkflowClient extends Client {}
}

declare module "@temporalio/worker" {
  interface TLSConfig {
    serverName?: string;
    clientCertPair?: { crt: Buffer; key: Buffer };
  }
  interface ConnectionOptions {
    address?: string;
    tls?: TLSConfig | boolean;
    apiKey?: string;
    identity?: string;
  }

  export class NativeConnection {
    static connect(opts?: ConnectionOptions): Promise<NativeConnection>;
    close(): Promise<void>;
  }

  export class Worker {
    static create(opts: Record<string, unknown>): Promise<Worker>;
    run(): Promise<void>;
    shutdown(): void;
  }
}
