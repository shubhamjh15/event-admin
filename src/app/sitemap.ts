import type { MetadataRoute } from "next";
import { getBlogs, getCategories, getEvents, getServices } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [events, services, blogs, categories] = await Promise.all([getEvents(), getServices(), getBlogs(), getCategories()]);
  const now = new Date();
  return [
    ...["", "/events", "/services", "/about", "/gallery", "/blogs", "/contact", "/book"].map((p) => ({ url: base + p, lastModified: now, priority: p ? 0.8 : 1 })),
    ...categories.map((c) => ({ url: `${base}/events?category=${c.slug}`, lastModified: new Date(c.updatedAt), priority: 0.7 })),
    ...events.map((e) => ({ url: `${base}/events/${e.slug}`, lastModified: new Date(e.updatedAt), priority: 0.7 })),
    ...services.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: new Date(s.updatedAt), priority: 0.6 })),
    ...blogs.map((b) => ({ url: `${base}/blogs/${b.slug}`, lastModified: new Date(b.updatedAt), priority: 0.6 })),
  ];
}
