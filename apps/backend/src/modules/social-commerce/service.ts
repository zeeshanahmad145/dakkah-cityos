import { MedusaService } from "@medusajs/framework/utils";
import LiveStream from "./models/live-stream";
import LiveProduct from "./models/live-product";
import SocialPost from "./models/social-post";
import SocialShare from "./models/social-share";
import GroupBuy from "./models/group-buy";

class SocialCommerceModuleService extends MedusaService({
  LiveStream,
  LiveProduct,
  SocialPost,
  SocialShare,
  GroupBuy,
}) {
  /**
   * Create a social commerce post with associated product listings.
   */
  async createPost(
    vendorId: string,
    content: string,
    products: string[],
  ): Promise<any> {
    const post = await this.createSocialPosts({
      vendor_id: vendorId,
      content,
      product_ids: products,
      status: "published",
      published_at: new Date(),
      engagement_count: 0,
      share_count: 0,
    } as any);
    return post;
  }

  /**
   * Track engagement (like, share, comment, click) on a social commerce post.
   */
  async trackEngagement(
    postId: string,
    type: "like" | "share" | "comment" | "click",
  ): Promise<any> {
    const post = await this.retrieveSocialPost(postId) as any;
    const updates: Record<string, any> = { id: postId };
    if (type === "share") {
      updates.share_count = (Number(post.share_count) || 0) + 1;
      await this.createSocialShares({
        post_id: postId,
        shared_at: new Date(),
      } as any);
    }
    updates.engagement_count = (Number(post.engagement_count) || 0) + 1;
    return await this.updateSocialPosts(updates);
  }

  /**
   * Get performance statistics for an influencer across their social posts.
   */
  async getInfluencerStats(influencerId: string): Promise<any> {
    const posts = await this.listSocialPosts({
      vendor_id: influencerId,
    }) as any;
    const postList = Array.isArray(posts) ? posts : [posts].filter(Boolean);
    const totalEngagement = postList.reduce(
      (sum: number, p: any) => sum + Number(p.engagement_count || 0),
      0,
    );
    const totalShares = postList.reduce(
      (sum: number, p: any) => sum + Number(p.share_count || 0),
      0,
    );
    return {
      influencerId,
      totalPosts: postList.length,
      totalEngagement,
      totalShares,
      avgEngagementPerPost:
        postList.length > 0 ? Math.round(totalEngagement / postList.length) : 0,
    };
  }

  /**
   * Calculate commission earned from a social commerce post based on engagement and sales.
   */
  async calculateCommission(
    postId: string,
  ): Promise<{ postId: string; engagementScore: number; commission: number }> {
    const post = await this.retrieveSocialPost(postId) as any;
    const engagementScore = Number(post.engagement_count || 0);
    const baseRate = 0.05;
    const commission = engagementScore * baseRate;
    return {
      postId,
      engagementScore,
      commission: Math.round(commission * 100) / 100,
    };
  }

  async getPostAnalytics(postId: string): Promise<{
    postId: string;
    engagementCount: number;
    shareCount: number;
    engagementRate: number;
    shares: any[];
  }> {
    const post = await this.retrieveSocialPost(postId) as any;
    const shares = await this.listSocialShares({ post_id: postId }) as any;
    const shareList = Array.isArray(shares) ? shares : [shares].filter(Boolean);

    const engagementCount = Number(post.engagement_count || 0);
    const shareCount = Number(post.share_count || 0);
    const viewCount = Number(post.view_count || 1);
    const engagementRate =
      viewCount > 0
        ? Math.round((engagementCount / viewCount) * 10000) / 100
        : 0;

    return {
      postId,
      engagementCount,
      shareCount,
      engagementRate,
      shares: shareList,
    };
  }

  async schedulePost(postId: string, publishAt: Date): Promise<any> {
    if (new Date(publishAt) <= new Date()) {
      throw new Error("Scheduled publication date must be in the future");
    }

    const post = await this.retrieveSocialPost(postId) as any;
    if (post.status === "published") {
      throw new Error("Post is already published");
    }

    return await this.updateSocialPosts({
      id: postId,
      status: "scheduled",
      scheduled_at: publishAt,
    } as any);
  }
}

export default SocialCommerceModuleService;
