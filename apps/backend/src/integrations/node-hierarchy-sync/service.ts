import { MedusaContainer } from "@medusajs/framework/types";
import axios from "axios";
import { appConfig } from "../../lib/config";
import { createLogger } from "../../lib/logger";
const logger = createLogger("integration:node-hierarchy-sync");

interface SyncStats {
  synced: number;
  failed: number;
  errors: string[];
}

interface HierarchySyncResult {
  payload: SyncStats;
  erpnext: SyncStats;
  fleetbase: SyncStats;
  waltid: SyncStats;
}

interface TreeNode {
  id: string;
  name: string;
  slug: string;
  type: string;
  depth: number;
  status: string;
  location: any;
  metadata: any;
  children: TreeNode[];
}

const ERPNEXT_TYPE_MAP: Record<string, string> = {
  CITY: "Company",
  DISTRICT: "Department",
  ZONE: "Cost Center",
  FACILITY: "Warehouse",
  ASSET: "Asset",
};

const FLEETBASE_TYPE_MAP: Record<string, string> = {
  CITY: "place",
  DISTRICT: "zone",
  ZONE: "zone",
  FACILITY: "fleet",
  ASSET: "vehicle",
};

export class NodeHierarchySyncService {
  private container: MedusaContainer;

  constructor(container: MedusaContainer) {
    this.container = container;
  }

  private getNodeService(): any {
    return this.container.resolve("nodeModuleService") as unknown as any;
  }

  private async buildHierarchyTree(tenantId: string): Promise<TreeNode[]> {
    const nodeService = this.getNodeService();
    const nodes = await nodeService.listNodesByTenant(tenantId);
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    for (const node of nodes) {
      nodeMap.set(node.id, {
        id: node.id,
        name: node.name,
        slug: node.slug,
        type: node.type,
        depth: node.depth,
        status: node.status,
        location: node.location,
        metadata: node.metadata,
        children: [],
      });
    }

    for (const node of nodes) {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id)!.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    }

    return roots;
  }

  async syncNodeToPayload(node: any, tenantId: string): Promise<void> {
    const payloadUrl = appConfig.payloadCms.url;
    const payloadKey = appConfig.payloadCms.apiKey;

    if (!payloadUrl || !payloadKey) {
      logger.info(
        "[NodeHierarchySync] Payload CMS not configured, skipping sync",
      );
      return;
    }

    const client = axios.create({
      baseURL: payloadUrl,
      headers: {
        Authorization: `Bearer ${payloadKey}`,
        "Content-Type": "application/json",
      },
    });

    const nodeData = {
      medusaNodeId: node.id,
      tenantId,
      name: node.name,
      slug: node.slug,
      code: node.code || null,
      type: node.type,
      depth: node.depth,
      parentId: node.parent_id || null,
      breadcrumbs: node.breadcrumbs || [],
      location: node.location || null,
      status: node.status,
      metadata: node.metadata || {},
      lastSyncedAt: new Date().toISOString(),
    };

    try {
      const existing = await client.get("/api/nodes", {
        params: {
          where: { medusaNodeId: { equals: node.id } },
          limit: 1,
        },
      });

      if (existing.data.docs?.[0]) {
        await client.patch(`/api/nodes/${existing.data.docs[0].id}`, nodeData);
        logger.info(
          `[NodeHierarchySync] Updated node ${node.id} in Payload CMS`,
        );
      } else {
        await client.post("/api/nodes", nodeData);
        logger.info(
          `[NodeHierarchySync] Created node ${node.id} in Payload CMS`,
        );
      }
    } catch (err: any) {
      logger.info(
        `[NodeHierarchySync] Failed to sync node ${node.id} to Payload: ${err.message}`,
      );
      throw err;
    }
  }

  async syncNodeToERPNext(node: any, tenantId: string): Promise<void> {
    const siteUrl = appConfig.erpnext.url;
    const apiKey = appConfig.erpnext.apiKey;
    const apiSecret = appConfig.erpnext.apiSecret;

    if (!siteUrl || !apiKey || !apiSecret) {
      logger.info("[NodeHierarchySync] ERPNext not configured, skipping sync");
      return;
    }

    const client = axios.create({
      baseURL: `${siteUrl}/api`,
      headers: {
        Authorization: `token ${apiKey}:${apiSecret}`,
        "Content-Type": "application/json",
      },
    });

    const doctype = ERPNEXT_TYPE_MAP[node.type];
    if (!doctype) {
      logger.info(
        `[NodeHierarchySync] No ERPNext mapping for node type: ${node.type}`,
      );
      return;
    }

    try {
      const filters = JSON.stringify([["custom_medusa_node_id", "=", node.id]]);
      const existing = await client
        .get(`/resource/${doctype}`, {
          params: { filters, limit_page_length: 1 },
        })
        .catch(() => ({ data: { data: [] } }));

      const resourceData: Record<string, any> = {
        custom_medusa_node_id: node.id,
        custom_tenant_id: tenantId,
      };

      switch (node.type) {
        case "CITY":
          resourceData.company_name = node.name;
          resourceData.abbr =
            node.code || node.slug.substring(0, 5).toUpperCase();
          resourceData.default_currency = "SAR";
          resourceData.country = "Saudi Arabia";
          break;
        case "DISTRICT":
          resourceData.department_name = node.name;
          resourceData.company = node.parent_id ? undefined : node.name;
          break;
        case "ZONE":
          resourceData.cost_center_name = node.name;
          break;
        case "FACILITY":
          resourceData.warehouse_name = node.name;
          resourceData.warehouse_type = "Warehouse";
          break;
        case "ASSET":
          resourceData.asset_name = node.name;
          resourceData.asset_category = "General";
          resourceData.item_code = node.code || node.slug;
          break;
      }

      if (existing.data.data?.length > 0) {
        const existingName = existing.data.data[0].name;
        await client.put(`/resource/${doctype}/${existingName}`, resourceData);
        logger.info(
          `[NodeHierarchySync] Updated node ${node.id} as ${doctype} in ERPNext`,
        );
      } else {
        await client.post(`/resource/${doctype}`, resourceData);
        logger.info(
          `[NodeHierarchySync] Created node ${node.id} as ${doctype} in ERPNext`,
        );
      }
    } catch (err: any) {
      logger.info(
        `[NodeHierarchySync] Failed to sync node ${node.id} to ERPNext: ${err.message}`,
      );
      throw err;
    }
  }

  async syncNodeToFleetbase(node: any, tenantId: string): Promise<void> {
    const apiUrl = appConfig.fleetbase.url;
    const apiKey = appConfig.fleetbase.apiKey;
    const orgId = appConfig.fleetbase.orgId;

    if (!apiUrl || !apiKey || !orgId) {
      logger.info(
        "[NodeHierarchySync] Fleetbase not configured, skipping sync",
      );
      return;
    }

    const client = axios.create({
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Organization-ID": orgId,
      },
    });

    const fleetbaseType = FLEETBASE_TYPE_MAP[node.type];
    if (!fleetbaseType) {
      logger.info(
        `[NodeHierarchySync] No Fleetbase mapping for node type: ${node.type}`,
      );
      return;
    }

    try {
      const resourceData: Record<string, any> = {
        name: node.name,
        meta: {
          medusa_node_id: node.id,
          tenant_id: tenantId,
          node_type: node.type,
          depth: node.depth,
        },
      };

      if (node.location) {
        resourceData.location = node.location;
      }

      let endpoint: string;

      switch (fleetbaseType) {
        case "place":
          endpoint = "/places";
          resourceData.type = node.type.toLowerCase();
          break;
        case "zone":
          endpoint = "/zones";
          resourceData.type = node.type.toLowerCase();
          break;
        case "fleet":
          endpoint = "/fleets";
          resourceData.fleet_type = "facility";
          break;
        case "vehicle":
          endpoint = "/vehicles";
          resourceData.vehicle_name = node.name;
          resourceData.plate_number = node.code || node.slug;
          break;
        default:
          endpoint = "/places";
      }

      const searchResponse = await client
        .get(endpoint, {
          params: { "meta.medusa_node_id": node.id, limit: 1 },
        })
        .catch(() => ({ data: { data: [] } }));

      const existingItems =
        searchResponse.data.data || searchResponse.data || [];

      if (Array.isArray(existingItems) && existingItems.length > 0) {
        await client.put(`${endpoint}/${existingItems[0].id}`, resourceData);
        logger.info(
          `[NodeHierarchySync] Updated node ${node.id} as ${fleetbaseType} in Fleetbase`,
        );
      } else {
        await client.post(endpoint, resourceData);
        logger.info(
          `[NodeHierarchySync] Created node ${node.id} as ${fleetbaseType} in Fleetbase`,
        );
      }
    } catch (err: any) {
      logger.info(
        `[NodeHierarchySync] Failed to sync node ${node.id} to Fleetbase: ${err.message}`,
      );
      throw err;
    }
  }

  async syncNodeToWaltId(node: any, tenantId: string): Promise<void> {
    const apiUrl = appConfig.waltid.url;
    const apiKey = appConfig.waltid.apiKey;

    if (!apiUrl || !apiKey) {
      logger.info("[NodeHierarchySync] WaltId not configured, skipping sync");
      return;
    }

    const client = axios.create({
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    try {
      const didResponse = await client.post("/v1/did/create", {
        method: "key",
      });

      const did = didResponse.data.did;
      logger.info(
        `[NodeHierarchySync] Created DID for node ${node.id}: ${did}`,
      );

      const credentialPayload = {
        issuerDid: did,
        subjectDid: did,
        credentialData: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", "NodeCredential"],
          issuer: did,
          credentialSubject: {
            id: did,
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            nodeDepth: node.depth,
            tenantId,
            hierarchyPosition: node.breadcrumbs || [],
            location: node.location || null,
            issuedAt: new Date().toISOString(),
          },
        },
      };

      const credResponse = await client.post(
        "/v1/credentials/issue",
        credentialPayload,
      );
      logger.info(
        `[NodeHierarchySync] Issued NodeCredential for node ${node.id}: ${credResponse.data.id || "issued"}`,
      );
    } catch (err: any) {
      logger.info(
        `[NodeHierarchySync] Failed to sync node ${node.id} to WaltId: ${err.message}`,
      );
      throw err;
    }
  }

  async syncFullHierarchy(tenantId: string): Promise<HierarchySyncResult> {
    logger.info(
      `[NodeHierarchySync] Starting full hierarchy sync for tenant ${tenantId}`,
    );

    const nodeService = this.getNodeService();
    const nodes = await nodeService.listNodesByTenant(tenantId);

    nodes.sort((a: any, b: any) => (a.depth || 0) - (b.depth || 0));

    const stats: HierarchySyncResult = {
      payload: { synced: 0, failed: 0, errors: [] },
      erpnext: { synced: 0, failed: 0, errors: [] },
      fleetbase: { synced: 0, failed: 0, errors: [] },
      waltid: { synced: 0, failed: 0, errors: [] },
    };

    for (const node of nodes) {
      try {
        await this.syncNodeToPayload(node, tenantId);
        stats.payload.synced++;
      } catch (err: any) {
        stats.payload.failed++;
        stats.payload.errors.push(`Node ${node.id}: ${err.message}`);
      }

      try {
        await this.syncNodeToERPNext(node, tenantId);
        stats.erpnext.synced++;
      } catch (err: any) {
        stats.erpnext.failed++;
        stats.erpnext.errors.push(`Node ${node.id}: ${err.message}`);
      }

      try {
        await this.syncNodeToFleetbase(node, tenantId);
        stats.fleetbase.synced++;
      } catch (err: any) {
        stats.fleetbase.failed++;
        stats.fleetbase.errors.push(`Node ${node.id}: ${err.message}`);
      }

      try {
        await this.syncNodeToWaltId(node, tenantId);
        stats.waltid.synced++;
      } catch (err: any) {
        stats.waltid.failed++;
        stats.waltid.errors.push(`Node ${node.id}: ${err.message}`);
      }
    }

    logger.info(
      `[NodeHierarchySync] Full hierarchy sync completed for tenant ${tenantId} - totalNodes: ${nodes.length}, payload: ${stats.payload.synced}/${nodes.length}, erpnext: ${stats.erpnext.synced}/${nodes.length}, fleetbase: ${stats.fleetbase.synced}/${nodes.length}, waltid: ${stats.waltid.synced}/${nodes.length}`,
    );

    return stats;
  }

  async syncSingleNode(nodeId: string): Promise<void> {
    logger.info(`[NodeHierarchySync] Syncing single node ${nodeId}`);

    const nodeService = this.getNodeService();
    const node = await nodeService.retrieveNode(nodeId);

    if (!node) {
      logger.info(`[NodeHierarchySync] Node ${nodeId} not found`);
      return;
    }

    const tenantId = node.tenant_id;

    const results: string[] = [];

    try {
      await this.syncNodeToPayload(node, tenantId);
      results.push("payload");
    } catch (err: any) {
      logger.info(
        `[NodeHierarchySync] Payload sync failed for node ${nodeId}: ${err.message}`,
      );
    }

    try {
      await this.syncNodeToERPNext(node, tenantId);
      results.push("erpnext");
    } catch (err: any) {
      logger.info(
        `[NodeHierarchySync] ERPNext sync failed for node ${nodeId}: ${err.message}`,
      );
    }

    try {
      await this.syncNodeToFleetbase(node, tenantId);
      results.push("fleetbase");
    } catch (err: any) {
      logger.info(
        `[NodeHierarchySync] Fleetbase sync failed for node ${nodeId}: ${err.message}`,
      );
    }

    try {
      await this.syncNodeToWaltId(node, tenantId);
      results.push("waltid");
    } catch (err: any) {
      logger.info(
        `[NodeHierarchySync] WaltId sync failed for node ${nodeId}: ${err.message}`,
      );
    }

    logger.info(
      `[NodeHierarchySync] Single node ${nodeId} synced to: ${results.join(", ") || "none"}`,
    );
  }

  async deleteNodeFromSystems(nodeId: string, tenantId: string): Promise<void> {
    logger.info(`[NodeHierarchySync] Deleting node ${nodeId} from all systems`);

    const payloadUrl = appConfig.payloadCms.url;
    const payloadKey = appConfig.payloadCms.apiKey;
    if (payloadUrl && payloadKey) {
      try {
        const client = axios.create({
          baseURL: payloadUrl,
          headers: {
            Authorization: `Bearer ${payloadKey}`,
            "Content-Type": "application/json",
          },
        });
        const existing = await client.get("/api/nodes", {
          params: { where: { medusaNodeId: { equals: nodeId } }, limit: 1 },
        });
        if (existing.data.docs?.[0]) {
          await client.delete(`/api/nodes/${existing.data.docs[0].id}`);
          logger.info(
            `[NodeHierarchySync] Deleted node ${nodeId} from Payload CMS`,
          );
        }
      } catch (err: any) {
        logger.info(
          `[NodeHierarchySync] Failed to delete node ${nodeId} from Payload: ${err.message}`,
        );
      }
    }

    const erpSiteUrl = appConfig.erpnext.url;
    const erpApiKey = appConfig.erpnext.apiKey;
    const erpApiSecret = appConfig.erpnext.apiSecret;
    if (erpSiteUrl && erpApiKey && erpApiSecret) {
      try {
        const client = axios.create({
          baseURL: `${erpSiteUrl}/api`,
          headers: {
            Authorization: `token ${erpApiKey}:${erpApiSecret}`,
            "Content-Type": "application/json",
          },
        });
        for (const doctype of Object.values(ERPNEXT_TYPE_MAP)) {
          try {
            const filters = JSON.stringify([
              ["custom_medusa_node_id", "=", nodeId],
            ]);
            const existing = await client.get(`/resource/${doctype}`, {
              params: { filters, limit_page_length: 1 },
            });
            if (existing.data.data?.length > 0) {
              await client.delete(
                `/resource/${doctype}/${existing.data.data[0].name}`,
              );
              logger.info(
                `[NodeHierarchySync] Deleted node ${nodeId} (${doctype}) from ERPNext`,
              );
              break;
            }
          } catch {}
        }
      } catch (err: any) {
        logger.info(
          `[NodeHierarchySync] Failed to delete node ${nodeId} from ERPNext: ${err.message}`,
        );
      }
    }

    const fbApiUrl = appConfig.fleetbase.url;
    const fbApiKey = appConfig.fleetbase.apiKey;
    const fbOrgId = appConfig.fleetbase.orgId;
    if (fbApiUrl && fbApiKey && fbOrgId) {
      try {
        const client = axios.create({
          baseURL: fbApiUrl,
          headers: {
            Authorization: `Bearer ${fbApiKey}`,
            "Content-Type": "application/json",
            "Organization-ID": fbOrgId,
          },
        });
        const endpoints = ["/places", "/zones", "/fleets", "/vehicles"];
        for (const endpoint of endpoints) {
          try {
            const searchResponse = await client.get(endpoint, {
              params: { "meta.medusa_node_id": nodeId, limit: 1 },
            });
            const items = searchResponse.data.data || searchResponse.data || [];
            if (Array.isArray(items) && items.length > 0) {
              await client.delete(`${endpoint}/${items[0].id}`);
              logger.info(
                `[NodeHierarchySync] Deleted node ${nodeId} from Fleetbase (${endpoint})`,
              );
              break;
            }
          } catch {}
        }
      } catch (err: any) {
        logger.info(
          `[NodeHierarchySync] Failed to delete node ${nodeId} from Fleetbase: ${err.message}`,
        );
      }
    }

    logger.info(
      `[NodeHierarchySync] Completed deletion of node ${nodeId} from all systems`,
    );
  }

  async getHierarchyTree(tenantId: string): Promise<TreeNode[]> {
    logger.info(
      `[NodeHierarchySync] Building hierarchy tree for tenant ${tenantId}`,
    );
    return this.buildHierarchyTree(tenantId);
  }
}
