import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { dbConnect } from "./db";
import * as M from "./models";
import { settings as defaultSettings } from "./seed-data";

export type SiteSettings = typeof defaultSettings;

const plain = <T,>(v: unknown): T => JSON.parse(JSON.stringify(v));

/** All public content reads share one cache tag; admin writes call revalidateTag(CONTENT_TAG). */
export const CONTENT_TAG = "content";
const cached = <A extends any[], R>(key: string, fn: (...a: A) => Promise<R>) =>
  unstable_cache(fn, [key], { tags: [CONTENT_TAG], revalidate: 600 });

const findCached = cached("find", async (modelName: string, filter: object, sort: object, limit: number) => {
  await dbConnect();
  return plain<any[]>(await (M as any)[modelName].find(filter).sort(sort).limit(limit).lean());
});
const findOneCached = cached("findOne", async (modelName: string, filter: object) => {
  await dbConnect();
  return plain<any>(await (M as any)[modelName].findOne(filter).lean());
});

const find = (model: any, filter: object = {}, sort: object = { order: 1 }, limit = 0) => findCached(model.modelName, filter, sort, limit);
const findOne = (model: any, filter: object) => findOneCached(model.modelName, filter);

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const doc = await findOne(M.Settings, { key: "site" });
  return { ...defaultSettings, ...(doc?.data || {}) };
});

export const getBanners = (page: string) => find(M.Banner, { page, active: { $ne: false } });
export const getCategories = () => find(M.EventCategory, { active: { $ne: false } });
export const getCategory = (slug: string) => findOne(M.EventCategory, { slug });
export const getEvents = (filter: object = {}, limit = 0) => find(M.Event, { active: { $ne: false }, ...filter }, { order: 1 }, limit);
export const getEvent = (slug: string) => findOne(M.Event, { slug, active: { $ne: false } });
export const getDestinations = () => find(M.Destination, { featured: { $ne: false } });
export const getServices = () => find(M.Service, { active: { $ne: false } });
export const getService = (slug: string) => findOne(M.Service, { slug, active: { $ne: false } });
export const getGallery = (limit = 0) => find(M.GalleryItem, {}, { order: 1 }, limit);
export const getTeam = () => find(M.TeamMember);
export const getTestimonials = () => find(M.Testimonial);
export const getFaqs = () => find(M.Faq);
export const getMilestones = () => find(M.Milestone);
export const getBlogs = (filter: object = {}, sort: object = { publishedAt: -1 }, limit = 0) =>
  find(M.Blog, { published: { $ne: false }, ...filter }, sort, limit);
export const getBlog = (slug: string) => findOne(M.Blog, { slug, published: { $ne: false } });
export const getComments = (blog: string) => find(M.Comment, { blog, approved: true }, { createdAt: -1 });

export async function incrementViews(slug: string) {
  await dbConnect();
  await M.Blog.updateOne({ slug }, { $inc: { views: 1 } });
}

export const getRatings = cached("ratings", async (): Promise<Record<string, { avg: number; count: number }>> => {
  await dbConnect();
  const rows = await M.Comment.aggregate([
    { $match: { approved: true, rating: { $gte: 1 } } },
    { $group: { _id: "$blog", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r: any) => [r._id, { avg: r.avg, count: r.count }]));
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function buildMetadata(m: { title?: string; description?: string; keywords?: string[]; image?: string; path?: string }): Metadata {
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: m.path ? { canonical: SITE_URL + m.path } : undefined,
    openGraph: { title: m.title, description: m.description, images: m.image ? [m.image] : undefined, url: m.path ? SITE_URL + m.path : undefined, type: "website" },
    twitter: { card: "summary_large_image", title: m.title, description: m.description, images: m.image ? [m.image] : undefined },
  };
}

export async function pageMetadata(page: string, path: string): Promise<Metadata> {
  try {
    const seo = await findOne(M.PageSeo, { page });
    return buildMetadata({ title: seo?.title, description: seo?.description, keywords: seo?.keywords, image: seo?.ogImage, path });
  } catch {
    return {};
  }
}

export function docMetadata(doc: any, fallback: { title: string; description?: string; image?: string }, path: string): Metadata {
  return buildMetadata({
    title: doc?.seoTitle || fallback.title,
    description: doc?.seoDescription || fallback.description,
    keywords: doc?.seoKeywords?.length ? doc.seoKeywords : undefined,
    image: doc?.ogImage || fallback.image,
    path,
  });
}
