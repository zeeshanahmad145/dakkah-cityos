import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Client } from "@replit/object-storage";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const client = new Client();

  const key = req.query.key as string;

  if (!key) {
    return res.status(400).json({ message: "File key is missing. Use ?key=filename" });
  }

  const dlResult = await (client.downloadAsStream(key) as any);
  const { ok, value: stream, error } = dlResult;

  if (!ok) {
    if (error?.toString().includes("not found")) {
      return res.status(404).json({ message: "File not found" });
    }
    return res
      .status(500)
      .json({ message: `Failed to retrieve file: ${error}` });
  }

  const ext = key.split(".").pop()?.toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
  else if (ext === "png") contentType = "image/png";
  else if (ext === "gif") contentType = "image/gif";
  else if (ext === "webp") contentType = "image/webp";
  else if (ext === "svg") contentType = "image/svg+xml";
  else if (ext === "pdf") contentType = "application/pdf";

  res.setHeader("Content-Type", contentType);

  // @ts-ignore
  stream.pipe(res);
}
