import { MedusaService } from "@medusajs/framework/utils";
import Node from "./models/node";

const HIERARCHY_RULES: Record<
  string,
  { depth: number; parent: string | null; children: string | null }
> = {
  CITY: { depth: 0, parent: null, children: "DISTRICT" },
  DISTRICT: { depth: 1, parent: "CITY", children: "ZONE" },
  ZONE: { depth: 2, parent: "DISTRICT", children: "FACILITY" },
  FACILITY: { depth: 3, parent: "ZONE", children: "ASSET" },
  ASSET: { depth: 4, parent: "FACILITY", children: null },
};

class NodeModuleService extends MedusaService({
  Node,
}) {
  async listNodesByTenant(tenantId: string, filters?: Record<string, any>) {
    const query: Record<string, any> = { tenant_id: tenantId, ...filters };
    const nodes = await this.listNodes(query) as any;
    return Array.isArray(nodes) ? nodes : [nodes].filter(Boolean);
  }

  async listChildren(nodeId: string) {
    const nodes = await this.listNodes({ parent_id: nodeId }) as any;
    return Array.isArray(nodes) ? nodes : [nodes].filter(Boolean);
  }

  async getAncestors(nodeId: string) {
    const ancestors: any[] = [];
    let currentId: string | null = nodeId;

    while (currentId) {
      const node = await this.retrieveNode(currentId) as any;
      if (!node) break;

      ancestors.unshift(node);
      currentId = node.parent_id || null;
    }

    ancestors.pop();

    return ancestors;
  }

  async getDescendants(nodeId: string) {
    const descendants: any[] = [];
    const queue: string[] = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.listChildren(currentId) as any;

      for (const child of children) {
        descendants.push(child);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  async getBreadcrumbs(nodeId: string) {
    const ancestors = await this.getAncestors(nodeId);
    const node = await this.retrieveNode(nodeId) as any;

    if (node) {
      ancestors.push(node);
    }

    return ancestors.map((n: any) => ({
      id: n.id,
      name: n.name,
      slug: n.slug,
      type: n.type,
      depth: n.depth,
    }));
  }

  validateParentChild(parentType: string, childType: string): boolean {
    const parentRule = HIERARCHY_RULES[parentType];
    if (!parentRule) return false;

    return parentRule.children === childType;
  }

  async createNodeWithValidation(data: {
    tenant_id: string;
    name: string;
    slug: string;
    code?: string;
    type: string;
    parent_id?: string | null;
    location?: Record<string, any> | null;
    status?: string;
    metadata?: Record<string, any> | null;
  }) {
    const rule = HIERARCHY_RULES[data.type];
    if (!rule) {
      throw new Error(`Invalid node type: ${data.type}`);
    }

    if (rule.parent && !data.parent_id) {
      throw new Error(
        `Node type ${data.type} requires a parent of type ${rule.parent}`,
      );
    }

    if (!rule.parent && data.parent_id) {
      throw new Error(`Node type ${data.type} cannot have a parent`);
    }

    let breadcrumbs: any[] | null = null;

    if (data.parent_id) {
      const parent = await this.retrieveNode(data.parent_id) as any;
      if (!parent) {
        throw new Error(`Parent node ${data.parent_id} not found`);
      }

      if (!this.validateParentChild(parent.type, data.type)) {
        throw new Error(
          `Invalid hierarchy: ${parent.type} cannot be parent of ${data.type}. ` +
            `Expected parent type: ${rule.parent}`,
        );
      }

      if (parent.tenant_id !== data.tenant_id) {
        throw new Error("Parent node belongs to a different tenant");
      }

      const parentBreadcrumbs = await this.getBreadcrumbs(data.parent_id);
      breadcrumbs = [
        ...parentBreadcrumbs,
        {
          name: data.name,
          slug: data.slug,
          type: data.type,
          depth: rule.depth,
        },
      ];
    } else {
      breadcrumbs = [
        {
          name: data.name,
          slug: data.slug,
          type: data.type,
          depth: rule.depth,
        },
      ];
    }

    return await this.createNodes({
      tenant_id: data.tenant_id,
      name: data.name,
      slug: data.slug,
      code: data.code || null,
      type: data.type,
      depth: rule.depth,
      parent_id: data.parent_id || null,
      breadcrumbs,
      location: data.location || null,
      status: data.status || "active",
      metadata: data.metadata || null,
    } as any);
  }

  async getNodePath(nodeId: string): Promise<
    Array<{
      id: string;
      name: string;
      type: string;
      depth: number;
    }>
  > {
    const path: Array<{
      id: string;
      name: string;
      type: string;
      depth: number;
    }> = [];
    let currentId: string | null = nodeId;

    while (currentId) {
      const node = await this.retrieveNode(currentId) as any;
      if (!node) break;

      path.unshift({
        id: node.id,
        name: node.name,
        type: node.type,
        depth: node.depth,
      });
      currentId = node.parent_id || null;
    }

    return path;
  }

  async getNodeDescendants(nodeId: string, maxDepth?: number): Promise<any[]> {
    const descendants: any[] = [];
    const queue: Array<{ id: string; currentDepth: number }> = [
      { id: nodeId, currentDepth: 0 },
    ];

    while (queue.length > 0) {
      const { id: currentId, currentDepth } = queue.shift()!;

      if (maxDepth !== undefined && currentDepth >= maxDepth) continue;

      const children = await this.listChildren(currentId) as any;
      const childList = Array.isArray(children)
        ? children
        : [children].filter(Boolean);

      for (const child of childList) {
        descendants.push(child);
        queue.push({ id: child.id, currentDepth: currentDepth + 1 });
      }
    }

    return descendants;
  }

  async validateNodePlacement(
    parentId: string,
    level: string,
  ): Promise<{
    valid: boolean;
    reason?: string;
    expectedParentType?: string;
  }> {
    const rule = HIERARCHY_RULES[level];
    if (!rule) {
      return { valid: false, reason: `Invalid node level: ${level}` };
    }

    if (!rule.parent) {
      return {
        valid: false,
        reason: `${level} is a root level and cannot have a parent`,
      };
    }

    const parent = await this.retrieveNode(parentId) as any;
    if (!parent) {
      return { valid: false, reason: `Parent node ${parentId} not found` };
    }

    if (parent.type !== rule.parent) {
      return {
        valid: false,
        reason: `${level} requires parent of type ${rule.parent}, but got ${parent.type}`,
        expectedParentType: rule.parent,
      };
    }

    return { valid: true };
  }
}

export default NodeModuleService;
