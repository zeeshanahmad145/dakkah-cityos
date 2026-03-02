import { defineLink } from "@medusajs/framework/utils";
import NodeModule from "../modules/node";
import SearchModule from "../modules/search";

export default defineLink(
  NodeModule.linkable.node,
  SearchModule.linkable.searchIndexConfig,
);
