import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import SagaModule from "../modules/saga";

// Links an Order to its distributed transaction (saga) instance.
// Used to look up the active saga for rollback when dispatch fails.
export default defineLink(
  OrderModule.linkable.order,
  SagaModule.linkable.sagaInstance,
);
