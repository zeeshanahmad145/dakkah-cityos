import { Module } from "@medusajs/framework/utils"
import TradeInService from "./service"

export const TRADE_IN_MODULE = "tradeInModule"

export default Module(TRADE_IN_MODULE, {
  service: TradeInService,
})
