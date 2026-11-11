import mongoose, { Schema, Model } from "mongoose";

const opts = { timestamps: true };
const { Mixed } = Schema.Types;

const seoFields = {
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  ogImage: String,
};

function model(name: string, schema: Schema): Model<any> {
  return (mongoose.models[name] as Model<any>) || mongoose.model(name, schema);
}

export const AdminUser = model(
  "AdminUser",
  new Schema({ name: String, email: { type: String, unique: true }, passwordHash: String, role: { type: String, default: "admin" } }, opts),
);

export const EventCategory = model(
  "EventCategory",
  new Schema(
    {
      name: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      tagline: String,
      description: String,
      image: String,
      icon: String,
      order: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
      ...seoFields,
    },
    opts,
  ),
);

export const Event = model(
  "Event",
  new Schema(
    {
      title: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      category: String, // EventCategory slug
      summary: String,
      description: String,
      heroImage: String,
      gallery: [String],
      destination: String,
      duration: String,
      guests: String,
      price: Number,
      priceNote: String,
      priceUnit: String, // flat | per-guest | per-day — how AI-agent quotes multiply the price (blank = inferred from priceNote)
      maxDiscountPct: Number, // private negotiation floor for AI agents (blank = site default); never exposed publicly
      inclusions: [String],
      itinerary: [{ day: String, title: String, details: String }],
      featured: { type: Boolean, default: false },
      topDestination: { type: Boolean, default: false },
      active: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
      ...seoFields,
    },
    opts,
  ),
);

export const Destination = model(
  "Destination",
  new Schema(
    { name: String, country: String, image: String, description: String, featured: { type: Boolean, default: true }, order: { type: Number, default: 0 } },
    opts,
  ),
);

export const Service = model(
  "Service",
  new Schema(
    {
      title: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      icon: String,
      summary: String,
      description: String,
      image: String,
      points: [String],
      order: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
      ...seoFields,
    },
    opts,
  ),
);

export const Banner = model(
  "Banner",
  new Schema(
    {
      page: { type: String, default: "home" },
      title: String,
      subtitle: String,
      mediaType: { type: String, default: "image" },
      url: String,
      poster: String,
      ctaLabel: String,
      ctaLink: String,
      order: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
    },
    opts,
  ),
);

export const GalleryItem = model(
  "GalleryItem",
  new Schema({ title: String, image: String, category: String, order: { type: Number, default: 0 } }, opts),
);

export const Blog = model(
  "Blog",
  new Schema(
    {
      title: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      excerpt: String,
      content: String,
      cover: String,
      author: String,
      category: String,
      tags: [String],
      featured: { type: Boolean, default: false },
      published: { type: Boolean, default: true },
      publishedAt: { type: Date, default: Date.now },
      views: { type: Number, default: 0 },
      pushedAt: Date, // when the post was emailed to newsletter subscribers
      pushedCount: Number,
      ...seoFields,
    },
    opts,
  ),
);

export const Comment = model(
  "Comment",
  new Schema(
    {
      blog: String, // blog slug
      name: String,
      email: String,
      text: String,
      rating: { type: Number, min: 1, max: 5 },
      approved: { type: Boolean, default: false },
    },
    opts,
  ),
);

export const TeamMember = model(
  "TeamMember",
  new Schema({ name: String, role: String, photo: String, bio: String, linkedin: String, email: String, order: { type: Number, default: 0 } }, opts),
);

export const Testimonial = model(
  "Testimonial",
  new Schema(
    {
      name: String,
      role: String,
      quote: String,
      rating: { type: Number, default: 5 },
      photo: String,
      email: String, // only for public submissions; never displayed
      source: { type: String, default: "admin" }, // admin | public
      approved: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
    },
    opts,
  ),
);

export const Faq = model("Faq", new Schema({ question: String, answer: String, order: { type: Number, default: 0 } }, opts));

export const Milestone = model(
  "Milestone",
  new Schema({ year: String, title: String, description: String, image: String, order: { type: Number, default: 0 } }, opts),
);

export const Enquiry = model(
  "Enquiry",
  new Schema(
    {
      name: String,
      email: String,
      phone: String,
      eventType: String,
      eventDate: String,
      guests: String,
      budget: String,
      destination: String,
      message: String,
      source: String,
      status: { type: String, default: "new" },
      notes: String,
      emailLog: String,
    },
    opts,
  ),
);

export const Booking = model(
  "Booking",
  new Schema(
    {
      kind: { type: String, default: "booking" }, // booking | appointment
      name: String,
      email: String,
      phone: String,
      eventPackage: String,
      eventDate: String,
      time: String,
      guests: String,
      mode: String, // appointment: in-person / video / phone
      paymentMethod: String,
      message: String,
      source: String, // website | ai-agent | quote-page
      agent: String, // AI client that placed the booking, when known
      quoteRef: { type: String, index: true },
      currency: String,
      amount: Number, // agreed total incl. tax
      deposit: Number, // amount due to confirm
      paidAmount: Number,
      paymentStatus: { type: String, default: "unpaid" }, // unpaid | link-created | deposit-paid | paid | failed
      paymentLinkId: String,
      paymentLinkUrl: String,
      paymentId: String,
      status: { type: String, default: "pending" },
      notes: String,
      emailLog: String,
    },
    opts,
  ),
);

export const CelebEvent = model(
  "CelebEvent",
  new Schema(
    {
      title: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      celebrities: [String],
      location: String,
      date: Date,
      cover: String,
      summary: String,
      description: String,
      highlights: [String],
      gallery: [String],
      videos: [String], // YouTube URLs
      published: { type: Boolean, default: true },
      featured: { type: Boolean, default: false },
      order: { type: Number, default: 0 },
      ...seoFields,
    },
    opts,
  ),
);

export const Quote = model(
  "Quote",
  new Schema(
    {
      ref: { type: String, required: true, unique: true },
      status: { type: String, default: "open" }, // open | booked | expired | withdrawn
      eventPackage: String, // Event slug
      eventTitle: String,
      eventDate: String,
      guests: Number,
      days: Number,
      priceUnit: String,
      currency: { type: String, default: "INR" },
      lines: [{ label: String, amount: Number, kind: String }], // kind: base | discount | negotiated | tax
      listTotal: Number, // gross before any discount, ex-tax
      subtotal: Number, // current price ex-tax
      floor: Number, // lowest acceptable subtotal (private)
      taxPct: Number,
      taxLabel: String,
      tax: Number,
      total: Number,
      depositPct: Number,
      deposit: Number,
      inclusions: [String],
      perks: [String],
      notes: [String],
      rounds: { type: Number, default: 0 },
      maxRounds: Number,
      history: [{ at: Date, offer: Number, competitorPrice: Number, competitorSource: String, response: String, priceAfter: Number, message: String }],
      priceMatchClaim: { type: Boolean, default: false },
      requirements: String,
      agent: String,
      channel: String, // mcp | rest | web
      customerName: String,
      customerEmail: String,
      bookingId: String,
      expiresAt: Date,
      adminNotes: String,
    },
    opts,
  ),
);

export const Subscriber = model("Subscriber", new Schema({ email: { type: String, unique: true }, active: { type: Boolean, default: true } }, opts));

export const PageSeo = model(
  "PageSeo",
  new Schema({ page: { type: String, unique: true }, title: String, description: String, keywords: [String], ogImage: String }, opts),
);

export const Settings = model("Settings", new Schema({ key: { type: String, default: "site", unique: true }, data: Mixed }, opts));

export const Media = model(
  "Media",
  new Schema({ filename: String, contentType: String, size: Number, data: Buffer }, opts),
);
