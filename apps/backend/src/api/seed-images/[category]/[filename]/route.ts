import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import * as fs from "fs";
import * as path from "path";

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const category = req.params.category as string;
  const filename = req.params.filename as string;

  const key = `${category}/${filename}`;

  if (!key || key.includes("..") || key.includes("~")) {
    return res.status(400).json({ message: "Invalid image key" });
  }

  const imagesDir = path.resolve(process.cwd(), "static", "seed-images");
  const filePath = path.join(imagesDir, key);

  if (!filePath.startsWith(imagesDir)) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Image not found" });
  }

  const ext = path.extname(filePath).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".gif") contentType = "image/gif";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".svg") contentType = "image/svg+xml";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
