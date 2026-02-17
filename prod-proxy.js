const http = require("http");

const BACKEND = { host: "127.0.0.1", port: 9000 };
const STOREFRONT = { host: "127.0.0.1", port: 5173 };
const LISTEN_PORT = 5000;

const API_PREFIXES = ["/platform", "/store", "/admin", "/commerce", "/auth", "/webhooks"];

let backendReady = false;
let storefrontReady = false;

function checkBackend() {
  const req = http.get({ hostname: "127.0.0.1", port: 9000, path: "/health", timeout: 2000 }, (res) => {
    backendReady = res.statusCode === 200;
  });
  req.on("error", () => { backendReady = false; });
  req.on("timeout", () => { req.destroy(); backendReady = false; });
}

function checkStorefront() {
  const req = http.get({ hostname: "127.0.0.1", port: 5173, path: "/", timeout: 2000 }, (res) => {
    storefrontReady = res.statusCode < 500;
    res.resume();
  });
  req.on("error", () => { storefrontReady = false; });
  req.on("timeout", () => { req.destroy(); storefrontReady = false; });
}

setInterval(() => { checkBackend(); checkStorefront(); }, 5000);
setTimeout(() => { checkBackend(); checkStorefront(); }, 1000);

function getTarget(url) {
  for (const prefix of API_PREFIXES) {
    if (url === prefix || url.startsWith(prefix + "/") || url.startsWith(prefix + "?")) {
      return BACKEND;
    }
  }
  return STOREFRONT;
}

function proxy(req, res) {
  if (req.url === "/health" || req.url === "/health/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      backend: backendReady ? "ready" : "booting",
      storefront: storefrontReady ? "ready" : "booting"
    }));
    return;
  }

  const target = getTarget(req.url);

  if (!backendReady && target === BACKEND) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Backend is still starting up, please try again shortly." }));
    return;
  }

  if (!storefrontReady && target === STOREFRONT) {
    res.writeHead(503, { "Content-Type": "text/html" });
    res.end("<html><body><h1>Starting up...</h1><p>The storefront is initializing. Please refresh in a moment.</p></body></html>");
    return;
  }

  const options = {
    hostname: target.host,
    port: target.port,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${target.host}:${target.port}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error(`Proxy error to ${target.host}:${target.port}${req.url}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Service temporarily unavailable" }));
    }
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer(proxy);

server.on("upgrade", (req, socket, head) => {
  const target = getTarget(req.url);
  const options = {
    hostname: target.host,
    port: target.port,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${target.host}:${target.port}` },
  };

  const proxyReq = http.request(options);
  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      `HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n` +
        Object.entries(proxyRes.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n") +
        "\r\n\r\n"
    );
    if (proxyHead.length) socket.write(proxyHead);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on("error", () => socket.end());
  proxyReq.end();
});

server.listen(LISTEN_PORT, "0.0.0.0", () => {
  console.log(`Production proxy listening on 0.0.0.0:${LISTEN_PORT}`);
  console.log("  /health always returns 200 (deployment health check)");
  console.log("  API routes → backend :9000");
  console.log("  All other routes → storefront :5173");
});
