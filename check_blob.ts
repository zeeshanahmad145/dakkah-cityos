import { list } from "@vercel/blob";
async function run() {
  const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
  console.log(`Total blobs in storage: ${blobs.length}`);
  blobs.slice(0, 10).forEach(b => console.log(` - ${b.pathname}`));
}
run();
