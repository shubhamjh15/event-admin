# Lit Concierge — Luxury Events Website + Admin CMS

Next.js 15 (App Router) · MongoDB (Mongoose) · Tailwind CSS · TypeScript

## Quick start

```bash
npm install
cp .env.example .env.local     # then edit values
npm run dev                    # http://localhost:3000
```

If `MONGODB_URI` is empty in development, an **in-memory MongoDB** starts automatically and is seeded with the full demo content. That data resets every time the server restarts. Set `MONGODB_URI` to keep data permanently.

**Admin:** `/admin`. The first admin account is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The defaults are `admin@litconcierge.com` / `LitAdmin@1989`; change them in **Site Settings → Admin account**.

## Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas / self-hosted connection string (**required in production**) |
| `JWT_SECRET` | Long random string used to sign admin sessions (**required in production**) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial admin account, created only if no admin exists |
| `NEXT_PUBLIC_SITE_URL` | Public URL, used for canonical URLs, Open Graph tags and the sitemap |

## Production deployment

```bash
npm run build && npm start
```

Works on Vercel, Render, Railway, a VPS with PM2, or any Node 20+ host.

1. Create a MongoDB Atlas cluster and set `MONGODB_URI`.
2. Set a strong `JWT_SECRET` and `NEXT_PUBLIC_SITE_URL`.
3. On first start the database seeds itself with all demo content (only when it's empty).
4. Log in to `/admin` and change the admin password.

`npm run seed` wipes the content in the database at `MONGODB_URI` and re-seeds it with the demo data. Admin users and uploads are kept. The same action is available in the admin panel: **Settings → Danger zone**.

Uploaded images and videos are stored in MongoDB (`Media` collection) and served from `/api/media/:id`, with range support for video. They work on serverless hosts with no extra storage service. Maximum upload size is 12 MB per file. For long hero videos, paste a hosted MP4 URL instead.

## What's included

### Public site
- **Home:** luxury hero video with rotating headlines, trust strip (licensed · bonded · insured · since 1989 · payment methods), values / mission / vision, event categories plus a featured-packages carousel, services snapshot and signature touches (hampers, designer wear, food tasting, insurance), testimonials, gallery with lightbox, story timeline, animated stats, blogs, enquiry and booking CTA, FAQs.
- **Events:** image/video carousel, sticky category filter, featured packages, top destinations, a section per category (Corporate Meetings, Incentives, Sales Force Trainings, Concerts, Birthdays, Weddings, Destination Weddings, Family Reunions, Group Travel, Cruises) with CTAs in between and at the bottom. Category pages are at `/events?category=…`.
- **Event package page:** gallery, day-by-day itinerary, inclusions, pricing card, booking CTA, related packages, Product JSON-LD.
- **Services:** carousel, all 12 services, a price-negotiation showcase (hotels, jets, villas, yachts, spaces, AV, transport, flights), alternating detail rows, and a page per service with an enquiry form.
- **About:** carousel, company brief, stats, mission and vision, values, journey, team, gallery, contact and enquiry form.
- **Blogs:** featured, most read, all posts with search and category filter. Each post has star ratings, a rating distribution, moderated comments, and BlogPosting JSON-LD.
- **Gallery, Contact (enquiry), Book (event booking or free consultation, with payment-method choice)**, 404 page, `sitemap.xml`, `robots.txt`, floating WhatsApp button, newsletter signup.

### Admin control (`/admin`)
1. **Dashboard:** KPIs, enquiries per month, pipeline by status, recent enquiries, upcoming bookings, comments awaiting approval, most-read posts.
2. **Enquiries:** search, status filter, inline status change, notes, CSV export.
3. **Bookings & appointments:** booking or appointment type, status, payment method, CSV export.
4. **Event packages** with an itinerary builder (add / reorder / remove days), gallery, inclusions, and per-event SEO. **Event categories** and **top destinations**.
5. **Services** CMS with per-service SEO.
6. **Banners & carousels:** images or videos per page (home / events / services / about / blogs).
7. **Gallery**.
8. **Blog posts** (Markdown editor with preview, per-post SEO) plus **comment moderation** (approve with one click, ratings).
9. **Page SEO** for every static page, plus dedicated SEO fields on services, events, categories and blogs, with a live Google preview and length meters.
10. **Team members**, testimonials, FAQs, journey milestones, newsletter subscribers.
11. **Site settings:** brand, since-year, trust badges, payment methods, price promise, hero video, contact details, socials, about / mission / vision / values / stats, admin account and password, demo reset.

### Security
- Admin pages and APIs are protected by middleware using an HTTP-only JWT session cookie.
- Passwords are hashed with bcrypt.
- Public forms validate input and are rate limited; login is rate limited.
- Admin input is whitelisted against the field schema, and Markdown is rendered with raw HTML escaped.

## Project structure

```
src/
  app/(site)/…        public pages (shared header/footer layout)
  app/admin/…         admin login + panel
  app/api/…           public + admin API routes
  components/         UI, carousels, forms, admin components
  lib/models.ts       Mongoose schemas
  lib/resources.ts    admin module definitions (fields, columns, filters)
  lib/seed-data.ts    all demo content and image library
```

Adding a field to any admin module takes two edits: the schema in `models.ts` and the field list in `resources.ts`. The form, list, API whitelist and CSV export pick it up automatically.
