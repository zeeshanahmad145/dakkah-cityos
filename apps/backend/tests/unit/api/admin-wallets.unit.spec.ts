import { vi } from "vitest";
vi.mock("../../../src/lib/api-error-handler", () => ({
  handleApiError: vi.fn((res, error, context) => {
    const msg = error.message || String(error);
    if (msg.includes("Not found")) {
      return res.status(404).json({ message: msg });
    }
    if (msg.includes("Insufficient balance")) {
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: msg }); // the test expects { message: "DB error" }
  }),
}));

import { GET } from "../../../src/api/admin/wallets/route";
import {
  GET as GET_ID,
  POST as POST_ID,
} from "../../../src/api/admin/wallets/[id]/route";

function makeMockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res;
}

describe("GET /admin/wallets", () => {
  let mockWalletService: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWalletService = {
      listWallets: vi.fn().mockResolvedValue([]),
      countWallets: vi.fn().mockResolvedValue(0),
    };
    mockReq = {
      query: {},
      scope: { resolve: vi.fn().mockReturnValue(mockWalletService) },
    };
    mockRes = makeMockRes();
  });

  it("returns wallets with count", async () => {
    const wallets = [{ id: "w1", balance: 100 }];
    mockWalletService.listWallets.mockResolvedValue(wallets);
    mockWalletService.countWallets.mockResolvedValue(1);
    await GET(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({ wallets, count: 1 });
  });

  it("applies pagination from query params", async () => {
    mockReq.query = { limit: "5", offset: "10" };
    await GET(mockReq, mockRes);
    expect(mockWalletService.listWallets).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ take: 5, skip: 10 }),
    );
  });

  it("defaults pagination to limit=20 offset=0", async () => {
    await GET(mockReq, mockRes);
    expect(mockWalletService.listWallets).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ take: 20, skip: 0 }),
    );
  });

  it("returns 500 on service error", async () => {
    mockWalletService.listWallets.mockRejectedValue(new Error("DB error"));
    await GET(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "DB error" });
  });

  it("returns empty array when no wallets", async () => {
    mockWalletService.listWallets.mockResolvedValue(null);
    mockWalletService.countWallets.mockResolvedValue(0);
    await GET(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({ wallets: [], count: 0 });
  });
});

describe("GET /admin/wallets/:id", () => {
  let mockWalletService: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWalletService = {
      retrieveWallet: vi.fn().mockResolvedValue({ id: "w1", balance: 500 }),
      getTransactionHistory: vi.fn().mockResolvedValue([]),
    };
    mockReq = {
      params: { id: "w1" },
      scope: { resolve: vi.fn().mockReturnValue(mockWalletService) },
    };
    mockRes = makeMockRes();
  });

  it("returns wallet with transactions", async () => {
    const txns = [{ id: "tx1", amount: 100 }];
    mockWalletService.getTransactionHistory.mockResolvedValue(txns);
    await GET_ID(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({
      wallet: { id: "w1", balance: 500 },
      transactions: txns,
    });
  });

  it("returns 404 when wallet not found", async () => {
    mockWalletService.retrieveWallet.mockRejectedValue(new Error("Not found"));
    await GET_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it("requests transaction history with limit 50", async () => {
    await GET_ID(mockReq, mockRes);
    expect(mockWalletService.getTransactionHistory).toHaveBeenCalledWith("w1", {
      limit: 50,
    });
  });

  it("resolves wallet service from scope", async () => {
    await GET_ID(mockReq, mockRes);
    expect(mockReq.scope.resolve).toHaveBeenCalledWith("wallet");
  });
});

describe("POST /admin/wallets/:id (credit/debit)", () => {
  let mockWalletService: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWalletService = {
      creditWallet: jest
        .fn()
        .mockResolvedValue({ id: "tx1", type: "credit", amount: 50 }),
      debitWallet: jest
        .fn()
        .mockResolvedValue({ id: "tx2", type: "debit", amount: 30 }),
    };
    mockReq = {
      params: { id: "w1" },
      body: { type: "credit", amount: 50, description: "Top up" },
      scope: { resolve: vi.fn().mockReturnValue(mockWalletService) },
    };
    mockRes = makeMockRes();
  });

  it("credits wallet successfully", async () => {
    await POST_ID(mockReq, mockRes);
    expect(mockWalletService.creditWallet).toHaveBeenCalledWith(
      "w1",
      50,
      "Top up",
      undefined,
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      transaction: { id: "tx1", type: "credit", amount: 50 },
    });
  });

  it("debits wallet successfully", async () => {
    mockReq.body = { type: "debit", amount: 30, description: "Fee" };
    await POST_ID(mockReq, mockRes);
    expect(mockWalletService.debitWallet).toHaveBeenCalledWith(
      "w1",
      30,
      "Fee",
      undefined,
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      transaction: { id: "tx2", type: "debit", amount: 30 },
    });
  });

  it("returns 400 on invalid type", async () => {
    mockReq.body = { type: "transfer", amount: 50 };
    await POST_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "type must be 'credit' or 'debit'",
    });
  });

  it("returns 400 on missing type", async () => {
    mockReq.body = { amount: 50 };
    await POST_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 on zero amount", async () => {
    mockReq.body = { type: "credit", amount: 0 };
    await POST_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "amount must be positive",
    });
  });

  it("returns 400 on negative amount", async () => {
    mockReq.body = { type: "credit", amount: -10 };
    await POST_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 on service error (insufficient balance)", async () => {
    mockReq.body = { type: "debit", amount: 1000 };
    mockWalletService.debitWallet.mockRejectedValue(
      new Error("Insufficient balance"),
    );
    await POST_ID(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Insufficient balance",
    });
  });

  it("passes reference_id when provided", async () => {
    mockReq.body = {
      type: "credit",
      amount: 50,
      description: "Refund",
      reference_id: "ord_123",
    };
    await POST_ID(mockReq, mockRes);
    expect(mockWalletService.creditWallet).toHaveBeenCalledWith(
      "w1",
      50,
      "Refund",
      "ord_123",
    );
  });
});
