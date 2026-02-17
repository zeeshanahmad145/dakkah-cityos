import { createServer } from "node:http";

const port = parseInt(process.env.PORT || "5000", 10);
const host = process.env.HOST || "0.0.0.0";

async function start() {
  const { listener } = await import("./.output/server/index.mjs");
  const server = createServer(listener);
  server.listen(port, host, () => {
    console.log(`Storefront listening on http://${host}:${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start storefront:", err);
  process.exit(1);
});
