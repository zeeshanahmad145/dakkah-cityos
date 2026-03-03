/**
 * OffersContent — Payload CMS collection definition.
 *
 * Copy this config into your Payload CMS project's payload.config.ts collections array.
 * See: https://payloadcms.com/docs/configuration/collections
 *
 * This file is a plain TypeScript object export — no Payload SDK dependency
 * needed in the Medusa backend. Import it in your Payload CMS app only.
 *
 * Usage in payload.config.ts:
 *   import { OffersContentCollection } from '@dakkah/offers-content-collection'
 *   export default buildConfig({ collections: [OffersContentCollection, ...] })
 */

// Typed as plain Record to avoid requiring 'payload' as a backend dependency.
// The actual Payload CollectionConfig type is structurally compatible.
export type PayloadField = Record<string, unknown>;
export type PayloadCollection = {
  slug: string;
  access?: Record<string, unknown>;
  admin?: Record<string, unknown>;
  fields: PayloadField[];
};

export const OffersContentCollection: PayloadCollection = {
  slug: "offers-content",
  access: {
    read: () => true, // Public read — content is served to storefront
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  admin: {
    useAsTitle: "offer_id",
    description:
      "Commerce offer page content — links kernel Offers to Payload content blocks",
    defaultColumns: ["offer_id", "seo_title", "locale", "updatedAt"],
    group: "Commerce",
  },
  fields: [
    {
      name: "offer_id",
      type: "text",
      required: true,
      unique: true,
      label: "Kernel Offer ID",
      admin: {
        description:
          "The ID of the Offer in the kernel registry (medusa backend)",
        placeholder: "offer_01HXXXXXXXXXXXXXXXXXXXXXXXX",
      },
    },
    {
      name: "locale",
      type: "select",
      defaultValue: "en",
      options: [
        { label: "English", value: "en" },
        { label: "Arabic (العربية)", value: "ar" },
        { label: "All locales", value: "default" },
      ],
    },
    {
      name: "seo_title",
      type: "text",
      label: "SEO Title",
      admin: { description: "Override the default offer title for SEO" },
    },
    {
      name: "seo_description",
      type: "textarea",
      label: "SEO Description",
      maxLength: 160,
    },
    {
      name: "seo_keywords",
      type: "text",
      label: "SEO Keywords (comma-separated)",
    },
    {
      name: "blocks",
      type: "blocks",
      label: "Content Blocks",
      blocks: [
        {
          slug: "hero",
          labels: { singular: "Hero Block", plural: "Hero Blocks" },
          fields: [
            { name: "title", type: "text" },
            { name: "subtitle", type: "text" },
            { name: "cta_label", type: "text" },
            { name: "background_media_url", type: "text" },
          ],
        },
        {
          slug: "features",
          labels: { singular: "Features Block", plural: "Feature Lists" },
          fields: [
            { name: "heading", type: "text" },
            {
              name: "items",
              type: "array",
              fields: [
                { name: "title", type: "text" },
                { name: "description", type: "textarea" },
                { name: "icon", type: "text" },
              ],
            },
          ],
        },
        {
          slug: "pricing",
          labels: { singular: "Pricing Block", plural: "Pricing Blocks" },
          fields: [
            { name: "heading", type: "text" },
            { name: "subheading", type: "text" },
            { name: "highlight_tier", type: "text" },
          ],
        },
        {
          slug: "gallery",
          labels: { singular: "Gallery Block", plural: "Gallery Blocks" },
          fields: [
            { name: "heading", type: "text" },
            {
              name: "media_urls",
              type: "array",
              fields: [
                { name: "url", type: "text" },
                { name: "alt", type: "text" },
              ],
            },
          ],
        },
        {
          slug: "reviews",
          labels: { singular: "Reviews Block", plural: "Reviews Blocks" },
          fields: [
            { name: "heading", type: "text" },
            { name: "show_rating", type: "checkbox", defaultValue: true },
            { name: "max_reviews", type: "number", defaultValue: 5 },
          ],
        },
        {
          slug: "cta",
          labels: { singular: "CTA Block", plural: "CTA Blocks" },
          fields: [
            { name: "label", type: "text" },
            {
              name: "action",
              type: "select",
              options: [
                "checkout",
                "contact",
                "book",
                "subscribe",
                "request_quote",
              ],
            },
            { name: "secondary_label", type: "text" },
          ],
        },
        {
          slug: "map",
          labels: { singular: "Map Block", plural: "Map Blocks" },
          fields: [
            { name: "heading", type: "text" },
            { name: "latitude", type: "number" },
            { name: "longitude", type: "number" },
            { name: "zoom", type: "number", defaultValue: 14 },
          ],
        },
        {
          slug: "schedule",
          labels: { singular: "Schedule Block", plural: "Schedule Blocks" },
          fields: [
            { name: "heading", type: "text" },
            { name: "booking_enabled", type: "checkbox", defaultValue: true },
            { name: "advance_booking_days", type: "number", defaultValue: 30 },
          ],
        },
        {
          slug: "custom",
          labels: { singular: "Custom Block", plural: "Custom Blocks" },
          fields: [
            { name: "block_type", type: "text" },
            { name: "data", type: "json" },
          ],
        },
      ],
    },
  ],
};
