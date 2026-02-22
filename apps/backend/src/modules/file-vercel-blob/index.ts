import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import { VercelBlobFileService } from "./service";

export default ModuleProvider(Modules.FILE, {
  services: [VercelBlobFileService],
});
