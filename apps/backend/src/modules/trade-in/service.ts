import { MedusaService } from "@medusajs/framework/utils"
import { TradeInRequest, TradeInOffer } from "./models"

class TradeInService extends MedusaService({
  TradeInRequest,
  TradeInOffer,
}) {}

export default TradeInService
