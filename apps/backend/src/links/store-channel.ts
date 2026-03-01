import { defineLink } from "@medusajs/framework/utils";
import StoreModule from "../modules/store";
import ChannelModule from "../modules/channel";

/**
 * Links a CityOS Store to a SalesChannelMapping.
 * Each tenant store can have multiple configured sales channels
 * (web, mobile, kiosk, API, internal). The medusa_sales_channel_id
 * on SalesChannelMapping connects to the native Medusa SalesChannel.
 */
export default defineLink(
  StoreModule.linkable.cityosStore,
  ChannelModule.linkable.salesChannelMapping,
);
