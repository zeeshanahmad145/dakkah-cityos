import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * GET /store/zones/locate
 * Finds the zone that contains a given lat/lng coordinate.
 * Query params: lat, lng
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const regionZoneService = req.scope.resolve("region-zone") as unknown as any;
    const { lat, lng } = req.query as { lat?: string; lng?: string };

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: "lat and lng query parameters are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res
        .status(400)
        .json({ error: "lat and lng must be valid numbers" });
    }

    let zone: any = null;
    if (typeof regionZoneService.getZoneForCoordinates === "function") {
      zone = await regionZoneService.getZoneForCoordinates(latitude, longitude);
    } else {
      // Fallback: list all zones and do simple bounding-box check
      const zones = (await regionZoneService.listDeliveryZones?.({})) ?? [];
      const zoneList = Array.isArray(zones) ? zones : [zones].filter(Boolean);

      zone =
        zoneList.find((z: any) => {
          const bounds = z.metadata?.bounds;
          if (!bounds) return false;
          return (
            latitude >= bounds.south &&
            latitude <= bounds.north &&
            longitude >= bounds.west &&
            longitude <= bounds.east
          );
        }) ?? null;
    }

    if (!zone) {
      return res.json({
        zone: null,
        message: "No zone found for these coordinates",
      });
    }

    return res.json({ zone });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-ZONES-LOCATE");
  }
}
