import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/client.js";

export type AuctionListing = {
  id: string;
  tenant_id: string;
  seller_id: string;
  product_id: string;
  title: string;
  description?: string;
  auction_type: "english" | "dutch" | "sealed" | "reserve";
  starting_price: number;
  reserve_price?: number;
  buy_now_price?: number;
  currency_code: string;
  bid_increment: number;
  starts_at: string;
  ends_at: string;
  auto_extend?: boolean;
  extend_minutes?: number;
  status: "draft" | "scheduled" | "active" | "ended" | "cancelled";
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function useAuctions() {
  return useQuery({
    queryKey: ["auctions"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/auctions", {
        method: "GET",
      });
      return response as { items: AuctionListing[]; count: number };
    },
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AuctionListing>) => {
      const response = await sdk.client.fetch("/admin/auctions", {
        method: "POST",
        body: data,
      });
      return response as { item: AuctionListing };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auctions"] }),
  });
}
