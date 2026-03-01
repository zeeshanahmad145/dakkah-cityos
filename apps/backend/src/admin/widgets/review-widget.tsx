import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type ReviewSummary = {
  id: string;
  rating: number;
  reviewer_id: string;
  content: string;
  status: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
};

const ReviewWidget = ({ data }: { data: { id: string } }) => {
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=review.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.review) {
          const r = d.product.review;
          setReview(Array.isArray(r) ? r[0] : r);
          if (Array.isArray(r) && r.length > 0) {
            setAvgRating(
              r.reduce((s: number, rv: ReviewSummary) => s + rv.rating, 0) /
                r.length,
            );
          }
        }
      })
      .catch(() => null);
  }, [data.id]);

  if (!review) return null;

  const stars = (n: number) =>
    "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Reviews</Heading>
        {avgRating !== null && (
          <div className="flex items-center gap-2">
            <Text className="text-yellow-500 text-lg">{stars(avgRating)}</Text>
            <Badge color="orange">{avgRating.toFixed(1)}</Badge>
          </div>
        )}
      </div>
      <div className="px-6 py-4 text-sm space-y-2">
        <div className="flex items-start gap-3">
          <Text className="text-yellow-500">{stars(review.rating)}</Text>
          <div>
            {review.is_verified_purchase && (
              <Badge color="green" className="text-xs mb-1">
                Verified Purchase
              </Badge>
            )}
            <Text className="text-ui-fg-subtle line-clamp-2">
              {review.content || "No content"}
            </Text>
            <Text className="text-ui-fg-muted text-xs mt-1">
              {review.created_at?.split("T")[0]} · {review.helpful_count || 0}{" "}
              helpful
            </Text>
          </div>
        </div>
        <Badge
          color={
            review.status === "published"
              ? "green"
              : review.status === "pending"
                ? "orange"
                : "grey"
          }
        >
          {review.status}
        </Badge>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default ReviewWidget;
