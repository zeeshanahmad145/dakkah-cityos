import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import WalletModule from "../modules/wallet";

export default defineLink(
  OrderModule.linkable.order,
  WalletModule.linkable.walletHold,
);
