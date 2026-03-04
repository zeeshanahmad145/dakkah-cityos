import { expect } from "vitest";

export interface CrudTestConfig {
  moduleName: string;
  basePath: string;
  createPayload: Record<string, any>;
  updatePayload: Record<string, any>;
  entityKey: string;
  listKey: string;
}

export function generateCrudTests(config: CrudTestConfig) {
  const PORT = process.env.TEST_PORT || 9000;
  const BASE_URL = `http://127.0.0.1:${PORT}${config.basePath}`;

  let token = "";

  const api = {
    async request(method: string, path: string, body?: any) {
      const url = `${BASE_URL}${path === "/" ? "" : path}`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = null; // No content or text
      }

      return { status: res.status, data };
    },
    get(path: string) {
      return this.request("GET", path);
    },
    post(path: string, body: any) {
      return this.request("POST", path, body);
    },
    delete(path: string) {
      return this.request("DELETE", path);
    },
  };

  describe(`${config.moduleName} E2E API CRUD`, () => {
    let createdEntityId: string;

    beforeAll(async () => {
      // Authenticate against the Live Medusa Server using default seed credentials
      const AUTH_URL = `http://127.0.0.1:${PORT}/auth/user/emailpass`;
      try {
        const res = await fetch(AUTH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "admin@dakkah.sa",
            password: "admin123456",
          }),
        });
        const data = await res.json();
        token = data.token;
        if (!token) {
          console.warn(
            "Failed to retrieve auth token. Login route returned:",
            data,
          );
        }
      } catch (err: any) {
        console.error("Auth Exception:", err.message);
      }
    });

    it("1. [CREATE] should create a new resource via POST", async () => {
      const res = await api.post("/", config.createPayload);

      if (res.status >= 300) {
        throw new Error(
          `[CREATE ERROR] Status: ${res.status}. Data: ${JSON.stringify(res.data, null, 2)}`,
        );
      }
      expect(res.data[config.entityKey]).toBeDefined();
      expect(res.data[config.entityKey].id).toBeDefined();

      createdEntityId = res.data[config.entityKey].id;
    });

    it("2. [READ] should fetch the newly created resource via GET /:id", async () => {
      expect(createdEntityId).toBeDefined();

      const res = await api.get(`/${createdEntityId}`);
      expect(res.status).toBe(200);
      expect(res.data[config.entityKey].id).toBe(createdEntityId);
    });

    it("3. [READ ALL] should include the resource in the list via GET /", async () => {
      const res = await api.get("/?limit=500");
      expect(res.status).toBe(200);
      expect(res.data[config.listKey]).toBeInstanceOf(Array);

      const listData = res.data[config.listKey] as any[];
      const firstFew = listData
        .slice(0, 3)
        .map((e: any) => ({ id: e.id, keys: Object.keys(e) }));
      console.log(
        `[DEBUG READ ALL] createdEntityId=${createdEntityId}, total=${listData.length}, first3=`,
        JSON.stringify(firstFew),
      );

      const found = listData.find((e: any) => e.id === createdEntityId);
      expect(found).toBeDefined();
    });

    it("4. [UPDATE] should update the resource via POST/PUT /:id", async () => {
      expect(createdEntityId).toBeDefined();

      const res = await api.post(`/${createdEntityId}`, config.updatePayload);
      if (res.status >= 300) {
        throw new Error(
          `[UPDATE ERROR] Status: ${res.status}. Data: ${JSON.stringify(res.data, null, 2)}`,
        );
      }

      // Verify the update actually applied by fetching again
      const verifyRes = await api.get(`/${createdEntityId}`);
      // Typically we'd check if the keys in updatePayload now match verifyRes.data,
      // but simplistic check here:
      const updatedEntity = verifyRes.data[config.entityKey];
      for (const [key, value] of Object.entries(config.updatePayload)) {
        expect(updatedEntity[key]).toEqual(value);
      }
    });

    it("5. [DELETE] should delete the resource via DELETE /:id", async () => {
      expect(createdEntityId).toBeDefined();

      const res = await api.delete(`/${createdEntityId}`);
      expect([200, 204]).toContain(res.status);
    });

    it("6. [VERIFY DELETION] resource should return 404 on subsequent reads", async () => {
      expect(createdEntityId).toBeDefined();

      const res = await api.get(`/${createdEntityId}`);
      // Usually a 404, or sometimes a 400 depending on framework error handling.
      // If it returns 200, verify that the soft deletion flag is set.
      if (res.status < 400) {
        expect(res.data[config.entityKey].deleted_at).not.toBeNull();
      } else {
        expect(res.status).toBeGreaterThanOrEqual(400);
      }
    });

    // Safety Fallback Teardown (in case a test failed before the DELETE step)
    afterAll(async () => {
      if (createdEntityId) {
        // Attempt a silent cleanup without assertions
        await api.delete(`/${createdEntityId}`);
      }
    });
  });
}
