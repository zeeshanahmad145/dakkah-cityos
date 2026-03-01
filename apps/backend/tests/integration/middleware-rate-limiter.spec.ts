import {
  storeRateLimiter,
  adminRateLimiter,
} from "../../src/api/middleware/rate-limiter";

const createMockReq = (overrides: Record<string, any> = {}) => ({
  method: "POST",
  ip: "127.0.0.1",
  headers: {},
  ...overrides,
});

const createMockRes = () => {
  const headers: Record<string, string> = {};
  const res: any = {
    setHeader: jest.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    _headers: headers,
  };
  return res;
};

describe("Rate Limiter Middleware", () => {
  describe("storeRateLimiter", () => {
    it("should allow GET requests without rate limiting", () => {
      const req = createMockReq({ method: "GET" });
      const res = createMockRes();
      const next = jest.fn();

      storeRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow POST requests under the limit", () => {
      const req = createMockReq({ ip: "10.0.0.1" });
      const res = createMockRes();
      const next = jest.fn();

      storeRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should set rate limit headers on mutation requests", () => {
      const req = createMockReq({ ip: "10.0.0.2" });
      const res = createMockRes();
      const next = jest.fn();

      storeRateLimiter(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Limit",
        expect.any(String),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Remaining",
        expect.any(String),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-RateLimit-Reset",
        expect.any(String),
      );
    });

    it("should return 429 when rate limit is exceeded", () => {
      const uniqueIp = `store-limit-${Date.now()}`;
      const next = jest.fn();

      for (let i = 0; i < 101; i++) {
        const req = createMockReq({ ip: uniqueIp });
        const res = createMockRes();
        storeRateLimiter(req, res, next);

        if (i === 100) {
          expect(res.status).toHaveBeenCalledWith(429);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              message: "Too Many Requests",
              type: "rate_limit_exceeded",
            }),
          );
        }
      }
    });

    it("should skip rate limiting for non-mutation methods", () => {
      const methods = ["GET", "HEAD", "OPTIONS"];
      methods.forEach((method) => {
        const req = createMockReq({ method, ip: "10.0.0.3" });
        const res = createMockRes();
        const next = jest.fn();

        storeRateLimiter(req, res, next);
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe("adminRateLimiter", () => {
    it("should allow POST requests under the admin limit", () => {
      const req = createMockReq({ ip: "10.0.1.1" });
      const res = createMockRes();
      const next = jest.fn();

      adminRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should allow GET requests without rate limiting", () => {
      const req = createMockReq({ method: "GET", ip: "10.0.1.2" });
      const res = createMockRes();
      const next = jest.fn();

      adminRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should set rate limit headers", () => {
      const req = createMockReq({ ip: "10.0.1.3" });
      const res = createMockRes();
      const next = jest.fn();

      adminRateLimiter(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", "1000");
    });

    it("should use x-forwarded-for header for IP detection", () => {
      const req = createMockReq({
        ip: undefined,
        headers: { "x-forwarded-for": "203.0.113.50" },
      });
      const res = createMockRes();
      const next = jest.fn();

      adminRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
