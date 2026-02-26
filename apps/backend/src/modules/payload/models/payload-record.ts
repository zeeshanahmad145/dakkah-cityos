import { model } from "@medusajs/framework/utils";

export const PayloadRecord = model.define("payload_record", {
  id: model.id().primaryKey(),
  payload_id: model.text(),
  collection_slug: model.text(),
});
