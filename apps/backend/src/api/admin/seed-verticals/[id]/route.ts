import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  return res.json({ item: { id } });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  return res.json({ item: { id, updated: true } });
}

export const PATCH = POST;
export const PUT = POST;

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  return res.status(200).json({ id, deleted: true });
}
