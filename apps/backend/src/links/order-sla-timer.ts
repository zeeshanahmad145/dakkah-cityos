import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import OrderOrchestrationModule from "../modules/order-orchestration";

export default defineLink(
  OrderModule.linkable.order,
  OrderOrchestrationModule.linkable.orderSlaTimer,
);
