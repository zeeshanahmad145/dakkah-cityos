import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type AuctionData = {
  id: string;
  auction_type: string;
  starting_price: number;
  current_bid: number;
  reserve_price: number;
  bid_increment: number;
  currency_code: string;
  starts_at: string;
  ends_at: string;
  bid_count: number;
  status: string;
};

const AuctionWidget = ({ data }: { data: { id: string } }) => {
  const [auction, setAuction] = useState<AuctionData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=auction_listing.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.auction_listing) setAuction(d.product.auction_listing);
      })
      .catch(() => null);
  }, [data.id]);

  if (!auction) return null;

  const statusColor = (s: string) =>
    s === "active"
      ? "green"
      : s === "ended"
        ? "orange"
        : s === "cancelled"
          ? "red"
          : "blue";

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Auction Details</Heading>
        <Badge color={statusColor(auction.status) as any}>
          {auction.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Type</Text>
          <Text className="font-medium capitalize">{auction.auction_type}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Starting Price</Text>
          <Text className="font-medium">
            {auction.starting_price?.toLocaleString()}{" "}
            {auction.currency_code?.toUpperCase()}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Current Bid</Text>
          <Text className="font-medium">
            {auction.current_bid?.toLocaleString() || "—"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Reserve</Text>
          <Text className="font-medium">
            {auction.reserve_price?.toLocaleString() || "None"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Bid Increment</Text>
          <Text className="font-medium">
            {auction.bid_increment?.toLocaleString()}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Bids</Text>
          <Text className="font-medium">{auction.bid_count || 0}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Starts</Text>
          <Text className="font-medium">
            {auction.starts_at?.split("T")[0]}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Ends</Text>
          <Text className="font-medium">{auction.ends_at?.split("T")[0]}</Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default AuctionWidget;
