// Client-safe admin resource definitions (no mongoose imports here).

export type FieldType =
  | "text" | "slug" | "textarea" | "markdown" | "richtext" | "number" | "image" | "images" | "video"
  | "tags" | "boolean" | "select" | "date" | "email" | "list";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  optionsFrom?: { resource: string; value: string; label: string };
  required?: boolean;
  help?: string;
  section?: string;
  fields?: Field[]; // for "list"
  half?: boolean;
  readOnly?: boolean; // shown in the admin but never written from the form
};

export type Resource = {
  key: string;
  model: string;
  label: string;
  singular: string;
  icon: string;
  group: string;
  fields: Field[];
  columns: { name: string; label: string; type?: "image" | "badge" | "boolean" | "date" | "price" }[];
  search: string[];
  sort: Record<string, 1 | -1>;
  filters?: { name: string; options: string[] }[];
  readOnlyCreate?: boolean;
  hidden?: boolean; // kept for data compatibility, not shown in the sidebar
  bulkUpload?: { imageField: string; titleField?: string }; // enables "Bulk upload" on the list page
  publicPath?: (doc: any) => string;
};

const seo: Field[] = [
  { name: "seoTitle", label: "Meta title", type: "text", section: "SEO", help: "Ideal length 50–60 characters" },
  { name: "seoDescription", label: "Meta description", type: "textarea", section: "SEO", help: "Ideal length 140–160 characters" },
  { name: "seoKeywords", label: "Focus keywords", type: "tags", section: "SEO" },
  { name: "ogImage", label: "Social share image", type: "image", section: "SEO" },
];

export const ENQUIRY_STATUS = ["new", "contacted", "proposal-sent", "won", "lost"];
export const BOOKING_STATUS = ["pending", "confirmed", "completed", "cancelled"];
export const QUOTE_STATUS = ["open", "booked", "expired", "withdrawn"];
export const PAYMENT_METHODS = ["Credit Card", "Debit Card", "Cheque", "Cash", "Bank Transfer"];
export const BANNER_PAGES = ["home", "events", "services", "about", "blogs"];

export const resources: Resource[] = [
  {
    key: "enquiries", model: "Enquiry", label: "Enquiries", singular: "Enquiry", icon: "Inbox", group: "CRM",
    fields: [
      { name: "status", label: "Status", type: "select", options: ENQUIRY_STATUS, half: true },
      { name: "source", label: "Source page", type: "text", half: true },
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "phone", label: "Phone", type: "text", half: true },
      { name: "eventType", label: "Event type", type: "text", half: true },
      { name: "eventDate", label: "Event date", type: "date", half: true },
      { name: "guests", label: "Guests", type: "text", half: true },
      { name: "budget", label: "Budget", type: "text", half: true },
      { name: "destination", label: "Destination", type: "text", half: true },
      { name: "message", label: "Message", type: "textarea" },
      { name: "notes", label: "Internal notes", type: "textarea" },
      { name: "emailLog", label: "Email delivery", type: "text", section: "Notifications", help: "Filled in automatically when the enquiry arrives" },
    ],
    columns: [
      { name: "name", label: "Name" }, { name: "eventType", label: "Event" }, { name: "eventDate", label: "Date" },
      { name: "budget", label: "Budget" }, { name: "status", label: "Status", type: "badge" }, { name: "createdAt", label: "Received", type: "date" },
    ],
    search: ["name", "email", "phone", "eventType", "destination"], sort: { createdAt: -1 },
    filters: [{ name: "status", options: ENQUIRY_STATUS }],
  },
  {
    key: "bookings", model: "Booking", label: "Bookings & Appointments", singular: "Booking", icon: "CalendarCheck", group: "CRM",
    fields: [
      { name: "kind", label: "Type", type: "select", options: ["booking", "appointment"], half: true },
      { name: "status", label: "Status", type: "select", options: BOOKING_STATUS, half: true },
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "phone", label: "Phone", type: "text", half: true },
      { name: "eventPackage", label: "Event package", type: "select", optionsFrom: { resource: "events", value: "slug", label: "title" }, half: true },
      { name: "eventDate", label: "Date", type: "date", half: true },
      { name: "time", label: "Time", type: "text", half: true },
      { name: "guests", label: "Guests", type: "text", half: true },
      { name: "mode", label: "Meeting mode", type: "select", options: ["In person", "Video call", "Phone call"], half: true },
      { name: "paymentMethod", label: "Payment method", type: "select", options: PAYMENT_METHODS, half: true },
      { name: "message", label: "Message", type: "textarea" },
      { name: "notes", label: "Internal notes", type: "textarea" },
      { name: "source", label: "Booked via", type: "text", half: true, section: "AI / quote booking", readOnly: true },
      { name: "agent", label: "AI assistant", type: "text", half: true, section: "AI / quote booking", readOnly: true },
      { name: "quoteRef", label: "Quote / booking ref", type: "text", half: true, section: "AI / quote booking", readOnly: true },
      { name: "currency", label: "Currency", type: "text", half: true, section: "AI / quote booking", readOnly: true },
      { name: "amount", label: "Agreed total (incl. tax)", type: "number", half: true, section: "AI / quote booking", readOnly: true },
      { name: "emailLog", label: "Email delivery", type: "text", section: "Notifications", help: "Filled in automatically when the request arrives" },
    ],
    columns: [
      { name: "name", label: "Name" }, { name: "kind", label: "Type", type: "badge" }, { name: "eventPackage", label: "Package" },
      { name: "eventDate", label: "Date" }, { name: "amount", label: "Total", type: "price" }, { name: "source", label: "Via", type: "badge" },
      { name: "status", label: "Status", type: "badge" },
    ],
    search: ["name", "email", "phone", "eventPackage", "quoteRef"], sort: { createdAt: -1 },
    filters: [{ name: "kind", options: ["booking", "appointment"] }, { name: "status", options: BOOKING_STATUS }, { name: "source", options: ["ai-agent"] }],
  },
  {
    key: "quotes", model: "Quote", label: "AI Quotes & Negotiations", singular: "Quote", icon: "Bot", group: "CRM", readOnlyCreate: true,
    fields: [
      { name: "ref", label: "Reference", type: "text", half: true, readOnly: true },
      { name: "status", label: "Status", type: "select", options: QUOTE_STATUS, half: true, help: "Set to withdrawn to stop this quote being booked" },
      { name: "eventTitle", label: "Package", type: "text", half: true, readOnly: true },
      { name: "eventDate", label: "Event date", type: "text", half: true, readOnly: true },
      { name: "guests", label: "Guests", type: "number", half: true, readOnly: true },
      { name: "days", label: "Days", type: "number", half: true, readOnly: true },
      { name: "agent", label: "AI assistant", type: "text", half: true, readOnly: true },
      { name: "channel", label: "Channel", type: "text", half: true, readOnly: true },
      { name: "customerName", label: "Customer", type: "text", half: true, readOnly: true },
      { name: "customerEmail", label: "Customer email", type: "text", half: true, readOnly: true },
      { name: "requirements", label: "Requirements from the assistant", type: "textarea", readOnly: true },
      { name: "listTotal", label: "List price (ex-tax)", type: "number", half: true, section: "Pricing", readOnly: true },
      { name: "subtotal", label: "Current price (ex-tax)", type: "number", half: true, section: "Pricing", readOnly: true },
      { name: "floor", label: "Private floor (ex-tax)", type: "number", half: true, section: "Pricing", readOnly: true, help: "Never shown to assistants or customers" },
      { name: "total", label: "Total incl. tax", type: "number", half: true, section: "Pricing", readOnly: true },
      { name: "rounds", label: "Negotiation rounds used", type: "number", half: true, section: "Pricing", readOnly: true },
      { name: "priceMatchClaim", label: "Price-match claim to verify", type: "boolean", half: true, section: "Pricing" },
      { name: "expiresAt", label: "Expires", type: "date", half: true, section: "Pricing" },
      {
        name: "lines", label: "Line items", type: "list", section: "Pricing", readOnly: true,
        fields: [{ name: "label", label: "Item", type: "text" }, { name: "amount", label: "Amount", type: "number" }],
      },
      {
        name: "history", label: "Negotiation history", type: "list", section: "Negotiation", readOnly: true,
        fields: [
          { name: "at", label: "When", type: "text" }, { name: "offer", label: "Assistant offer (incl. tax)", type: "number" },
          { name: "competitorPrice", label: "Competitor price", type: "number" }, { name: "competitorSource", label: "Competitor source", type: "text" },
          { name: "response", label: "Our response", type: "text" }, { name: "priceAfter", label: "Price after (incl. tax)", type: "number" },
          { name: "message", label: "Message", type: "textarea" },
        ],
      },
      { name: "bookingId", label: "Booking record", type: "text", section: "Booking", readOnly: true },
      { name: "adminNotes", label: "Internal notes", type: "textarea", section: "Booking" },
    ],
    columns: [
      { name: "ref", label: "Ref" }, { name: "eventTitle", label: "Package" }, { name: "eventDate", label: "Date" },
      { name: "total", label: "Total", type: "price" }, { name: "rounds", label: "Rounds" }, { name: "agent", label: "Assistant" },
      { name: "status", label: "Status", type: "badge" }, { name: "createdAt", label: "Created", type: "date" },
    ],
    search: ["ref", "eventTitle", "customerName", "customerEmail", "agent"], sort: { createdAt: -1 },
    filters: [{ name: "status", options: QUOTE_STATUS }],
  },
  {
    key: "subscribers", model: "Subscriber", label: "Newsletter Subscribers", singular: "Subscriber", icon: "Mail", group: "CRM",
    fields: [
      { name: "email", label: "Email", type: "email", required: true },
      { name: "active", label: "Subscribed", type: "boolean" },
    ],
    columns: [{ name: "email", label: "Email" }, { name: "active", label: "Subscribed", type: "boolean" }, { name: "createdAt", label: "Joined", type: "date" }],
    search: ["email"], sort: { createdAt: -1 },
  },
  {
    key: "eventCategories", model: "EventCategory", label: "Event Categories", singular: "Category", icon: "Shapes", group: "Catalogue",
    publicPath: (d) => `/events?category=${d.slug}`,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "slug", label: "URL slug", type: "slug", required: true, half: true },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Image", type: "image" },
      { name: "icon", label: "Icon (lucide name)", type: "text", half: true, help: "e.g. Heart, Briefcase, Music" },
      { name: "order", label: "Sort order", type: "number", half: true },
      { name: "active", label: "Published", type: "boolean" },
      ...seo,
    ],
    columns: [{ name: "image", label: "", type: "image" }, { name: "name", label: "Name" }, { name: "tagline", label: "Tagline" }, { name: "order", label: "Order" }],
    search: ["name"], sort: { order: 1 },
  },
  {
    key: "events", model: "Event", label: "Event Packages", singular: "Event package", icon: "PartyPopper", group: "Catalogue",
    publicPath: (d) => `/events/${d.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, half: true },
      { name: "slug", label: "URL slug", type: "slug", required: true, half: true },
      { name: "category", label: "Category", type: "select", optionsFrom: { resource: "eventCategories", value: "slug", label: "name" }, half: true },
      { name: "destination", label: "Destination", type: "text", half: true },
      { name: "duration", label: "Duration", type: "text", half: true },
      { name: "guests", label: "Guest range", type: "text", half: true },
      { name: "price", label: "Price from", type: "number", half: true, help: "Shown with the currency symbol from Site Settings" },
      { name: "priceNote", label: "Price note", type: "text", half: true },
      { name: "priceUnit", label: "Price basis (AI quotes)", type: "select", options: ["flat", "per-guest", "per-day"], half: true, section: "AI agent pricing", help: "How AI-assistant quotes multiply the price. Leave blank to infer it from the price note." },
      { name: "maxDiscountPct", label: "Max negotiable discount %", type: "number", half: true, section: "AI agent pricing", help: "Private floor for AI negotiation. Blank uses the default in Settings." },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "richtext" },
      { name: "heroImage", label: "Hero image", type: "image" },
      { name: "gallery", label: "Gallery", type: "images" },
      { name: "inclusions", label: "Inclusions", type: "tags" },
      {
        name: "itinerary", label: "Itinerary", type: "list", section: "Itinerary",
        fields: [
          { name: "day", label: "Day", type: "text" },
          { name: "title", label: "Title", type: "text" },
          { name: "details", label: "Details", type: "textarea" },
        ],
      },
      { name: "featured", label: "Featured", type: "boolean", half: true },
      { name: "topDestination", label: "Top destination", type: "boolean", half: true, help: "Show in the Top Destinations section" },
      { name: "active", label: "Published", type: "boolean", half: true },
      { name: "order", label: "Sort order", type: "number", half: true },
      ...seo,
    ],
    columns: [
      { name: "heroImage", label: "", type: "image" }, { name: "title", label: "Title" }, { name: "category", label: "Category", type: "badge" },
      { name: "price", label: "From", type: "price" }, { name: "featured", label: "Featured", type: "boolean" },
      { name: "topDestination", label: "Top dest.", type: "boolean" }, { name: "active", label: "Live", type: "boolean" },
    ],
    search: ["title", "destination", "category"], sort: { order: 1 },
  },
  {
    key: "destinations", model: "Destination", label: "Top Destinations", singular: "Destination", icon: "MapPin", group: "Catalogue", hidden: true,
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "country", label: "Country", type: "text", half: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Image", type: "image" },
      { name: "featured", label: "Show on site", type: "boolean", half: true },
      { name: "order", label: "Sort order", type: "number", half: true },
    ],
    columns: [{ name: "image", label: "", type: "image" }, { name: "name", label: "Name" }, { name: "country", label: "Country" }, { name: "featured", label: "Live", type: "boolean" }],
    search: ["name", "country"], sort: { order: 1 },
  },
  {
    key: "services", model: "Service", label: "Services", singular: "Service", icon: "Sparkles", group: "Catalogue",
    publicPath: (d) => `/services/${d.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, half: true },
      { name: "slug", label: "URL slug", type: "slug", required: true, half: true },
      { name: "icon", label: "Icon (lucide name)", type: "text", half: true },
      { name: "order", label: "Sort order", type: "number", half: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "richtext" },
      { name: "image", label: "Image", type: "image" },
      { name: "points", label: "Key points", type: "tags" },
      { name: "active", label: "Published", type: "boolean" },
      ...seo,
    ],
    columns: [{ name: "image", label: "", type: "image" }, { name: "title", label: "Title" }, { name: "summary", label: "Summary" }, { name: "active", label: "Live", type: "boolean" }],
    search: ["title", "summary"], sort: { order: 1 },
  },
  {
    key: "banners", model: "Banner", label: "Banners & Carousels", singular: "Banner", icon: "GalleryHorizontal", group: "Media",
    fields: [
      { name: "page", label: "Page", type: "select", options: BANNER_PAGES, half: true },
      { name: "mediaType", label: "Media type", type: "select", options: ["image", "video"], half: true },
      { name: "url", label: "Image / video", type: "image", help: "For video, upload an MP4 or paste a video URL" },
      { name: "poster", label: "Video poster image", type: "image" },
      { name: "title", label: "Headline", type: "text" },
      { name: "subtitle", label: "Sub-headline", type: "text" },
      { name: "ctaLabel", label: "Button label", type: "text", half: true },
      { name: "ctaLink", label: "Button link", type: "text", half: true },
      { name: "order", label: "Sort order", type: "number", half: true },
      { name: "active", label: "Active", type: "boolean", half: true },
    ],
    columns: [{ name: "url", label: "", type: "image" }, { name: "title", label: "Headline" }, { name: "page", label: "Page", type: "badge" }, { name: "mediaType", label: "Type" }, { name: "active", label: "Active", type: "boolean" }],
    search: ["title", "subtitle"], sort: { page: 1, order: 1 },
    filters: [{ name: "page", options: BANNER_PAGES }],
  },
  {
    key: "gallery", model: "GalleryItem", label: "Gallery", singular: "Photo", icon: "Images", group: "Media",
    bulkUpload: { imageField: "image", titleField: "title" },
    fields: [
      { name: "image", label: "Image", type: "image", required: true },
      { name: "title", label: "Caption", type: "text", half: true },
      { name: "category", label: "Category", type: "text", half: true },
      { name: "order", label: "Sort order", type: "number" },
    ],
    columns: [{ name: "image", label: "", type: "image" }, { name: "title", label: "Caption" }, { name: "category", label: "Category", type: "badge" }],
    search: ["title", "category"], sort: { order: 1 },
  },
  {
    key: "celebEvents", model: "CelebEvent", label: "Celeb Zone", singular: "Celebrity event", icon: "Star", group: "Content",
    publicPath: (d) => `/celeb-zone/${d.slug}`,
    fields: [
      { name: "title", label: "Heading", type: "text", required: true, half: true },
      { name: "slug", label: "URL slug", type: "slug", required: true, half: true },
      { name: "location", label: "Location", type: "text", half: true },
      { name: "date", label: "Event date", type: "date", half: true },
      { name: "celebrities", label: "Celebrities", type: "tags", help: "Names shown on the event page" },
      { name: "cover", label: "Card image", type: "image", required: true },
      { name: "summary", label: "Short summary", type: "textarea" },
      { name: "description", label: "Event details", type: "richtext" },
      { name: "highlights", label: "Highlights", type: "tags" },
      { name: "gallery", label: "Photos", type: "images" },
      { name: "videos", label: "YouTube videos", type: "tags", help: "Paste YouTube links (watch, youtu.be or shorts) and press Enter" },
      { name: "featured", label: "Featured", type: "boolean", half: true },
      { name: "published", label: "Published", type: "boolean", half: true },
      { name: "order", label: "Sort order", type: "number", half: true },
      ...seo,
    ],
    columns: [
      { name: "cover", label: "", type: "image" }, { name: "title", label: "Heading" }, { name: "location", label: "Location" },
      { name: "date", label: "Date", type: "date" }, { name: "published", label: "Live", type: "boolean" },
    ],
    search: ["title", "location", "celebrities"], sort: { order: 1, date: -1 },
  },
  {
    key: "blogs", model: "Blog", label: "Blog Posts", singular: "Post", icon: "Newspaper", group: "Content",
    publicPath: (d) => `/blogs/${d.slug}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, half: true },
      { name: "slug", label: "URL slug", type: "slug", required: true, half: true },
      { name: "author", label: "Author", type: "text", half: true },
      { name: "category", label: "Category", type: "text", half: true },
      { name: "publishedAt", label: "Publish date", type: "date", half: true },
      { name: "views", label: "Views", type: "number", half: true },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "cover", label: "Cover image", type: "image" },
      { name: "content", label: "Content", type: "richtext" },
      { name: "tags", label: "Tags", type: "tags" },
      { name: "featured", label: "Featured", type: "boolean", half: true },
      { name: "published", label: "Published", type: "boolean", half: true },
      ...seo,
    ],
    columns: [
      { name: "cover", label: "", type: "image" }, { name: "title", label: "Title" }, { name: "category", label: "Category", type: "badge" },
      { name: "views", label: "Views" }, { name: "featured", label: "Featured", type: "boolean" }, { name: "published", label: "Live", type: "boolean" },
    ],
    search: ["title", "author", "category"], sort: { publishedAt: -1 },
  },
  {
    key: "comments", model: "Comment", label: "Comments & Ratings", singular: "Comment", icon: "MessageSquare", group: "Content",
    fields: [
      { name: "blog", label: "Post", type: "select", optionsFrom: { resource: "blogs", value: "slug", label: "title" } },
      { name: "name", label: "Name", type: "text", half: true },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "rating", label: "Rating (1–5)", type: "number", half: true },
      { name: "approved", label: "Approved", type: "boolean", half: true },
      { name: "text", label: "Comment", type: "textarea" },
    ],
    columns: [
      { name: "name", label: "Name" }, { name: "blog", label: "Post" }, { name: "text", label: "Comment" },
      { name: "rating", label: "Rating" }, { name: "approved", label: "Approved", type: "boolean" }, { name: "createdAt", label: "Date", type: "date" },
    ],
    search: ["name", "text", "blog"], sort: { createdAt: -1 },
    filters: [{ name: "approved", options: ["true", "false"] }],
  },
  {
    key: "team", model: "TeamMember", label: "Team Members", singular: "Member", icon: "Users", group: "Company",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "role", label: "Role", type: "text", half: true },
      { name: "photo", label: "Photo", type: "image" },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "linkedin", label: "LinkedIn URL", type: "text", half: true },
      { name: "order", label: "Sort order", type: "number" },
    ],
    columns: [{ name: "photo", label: "", type: "image" }, { name: "name", label: "Name" }, { name: "role", label: "Role" }, { name: "order", label: "Order" }],
    search: ["name", "role"], sort: { order: 1 },
  },
  {
    key: "testimonials", model: "Testimonial", label: "Testimonials", singular: "Testimonial", icon: "Quote", group: "Company",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "role", label: "Event / role", type: "text", half: true },
      { name: "quote", label: "Quote", type: "textarea" },
      { name: "photo", label: "Photo", type: "image" },
      { name: "rating", label: "Rating", type: "number", half: true },
      { name: "order", label: "Sort order", type: "number", half: true },
      { name: "approved", label: "Approved (shown on site)", type: "boolean", half: true },
      { name: "source", label: "Source", type: "select", options: ["admin", "public"], half: true },
      { name: "email", label: "Submitter email (private)", type: "email" },
    ],
    columns: [
      { name: "photo", label: "", type: "image" }, { name: "name", label: "Name" }, { name: "role", label: "Event" }, { name: "rating", label: "Rating" },
      { name: "source", label: "Source", type: "badge" }, { name: "approved", label: "Approved", type: "boolean" },
    ],
    search: ["name", "quote"], sort: { approved: 1, order: 1, createdAt: -1 },
    filters: [{ name: "approved", options: ["true", "false"] }],
  },
  {
    key: "faqs", model: "Faq", label: "FAQs", singular: "FAQ", icon: "HelpCircle", group: "Company",
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Answer", type: "textarea" },
      { name: "order", label: "Sort order", type: "number" },
    ],
    columns: [{ name: "question", label: "Question" }, { name: "order", label: "Order" }],
    search: ["question", "answer"], sort: { order: 1 },
  },
  {
    key: "milestones", model: "Milestone", label: "Journey / Story", singular: "Milestone", icon: "Milestone", group: "Company",
    fields: [
      { name: "year", label: "Year", type: "text", half: true },
      { name: "order", label: "Sort order", type: "number", half: true },
      { name: "title", label: "Title", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Image", type: "image" },
    ],
    columns: [{ name: "image", label: "", type: "image" }, { name: "year", label: "Year" }, { name: "title", label: "Title" }],
    search: ["title", "year"], sort: { order: 1 },
  },
  {
    key: "seo", model: "PageSeo", label: "Page SEO", singular: "Page SEO", icon: "Search", group: "Settings",
    fields: [
      { name: "page", label: "Page key", type: "select", options: ["home", "events", "services", "about", "blogs", "contact", "book", "celeb-zone", "testimonials"] },
      { name: "title", label: "Meta title", type: "text", help: "Ideal length 50–60 characters" },
      { name: "description", label: "Meta description", type: "textarea", help: "Ideal length 140–160 characters" },
      { name: "keywords", label: "Keywords", type: "tags" },
      { name: "ogImage", label: "Social share image", type: "image" },
    ],
    columns: [{ name: "page", label: "Page", type: "badge" }, { name: "title", label: "Title" }, { name: "description", label: "Description" }],
    search: ["page", "title"], sort: { page: 1 },
  },
];

export const resourceMap = Object.fromEntries(resources.map((r) => [r.key, r]));

export const settingsFields: Field[] = [
  { name: "siteName", label: "Site name", type: "text", half: true, section: "Brand" },
  { name: "tagline", label: "Tagline", type: "text", half: true, section: "Brand" },
  { name: "since", label: "In business since", type: "text", half: true, section: "Brand" },
  { name: "currency", label: "Currency symbol", type: "text", half: true, section: "Brand" },
  { name: "priceBadge", label: "Price promise", type: "text", section: "Brand" },
  { name: "trustBadges", label: "Trust badges", type: "tags", section: "Brand" },
  { name: "paymentMethods", label: "Accepted payments", type: "tags", section: "Brand" },
  { name: "budgetRanges", label: "Budget options (enquiry form)", type: "tags", section: "Brand", help: "Shown in the enquiry form budget dropdown" },
  { name: "heroVideo", label: "Home hero video (MP4)", type: "video", section: "Home hero" },
  { name: "heroPoster", label: "Hero poster image", type: "image", section: "Home hero" },
  { name: "phone", label: "Phone", type: "text", half: true, section: "Contact" },
  { name: "whatsapp", label: "WhatsApp number", type: "text", half: true, section: "Contact" },
  { name: "email", label: "Email", type: "email", half: true, section: "Contact" },
  { name: "notifyEmail", label: "Send enquiry alerts to", type: "email", half: true, section: "Contact", help: "Admin inbox for new enquiries, bookings and testimonials (defaults to the email above)" },
  { name: "hours", label: "Hours", type: "text", half: true, section: "Contact" },
  { name: "address", label: "Address", type: "textarea", section: "Contact" },
  { name: "expertise", label: "Expertise statement", type: "textarea", section: "About" },
  { name: "aboutShort", label: "Short about", type: "textarea", section: "About" },
  { name: "about", label: "Full about", type: "richtext", section: "About" },
  { name: "mission", label: "Mission", type: "textarea", section: "About" },
  { name: "vision", label: "Vision", type: "textarea", section: "About" },
  { name: "footerAbout", label: "Footer blurb", type: "textarea", section: "About" },
  { name: "values", label: "Core values", type: "list", section: "About", fields: [{ name: "title", label: "Title", type: "text" }, { name: "text", label: "Text", type: "textarea" }] },
  { name: "stats", label: "Stats", type: "list", section: "About", fields: [{ name: "value", label: "Value", type: "text" }, { name: "label", label: "Label", type: "text" }] },
  {
    name: "signatureTouches", label: "Signature touches", type: "list", section: "About",
    fields: [{ name: "title", label: "Title", type: "text" }, { name: "text", label: "Text", type: "textarea" }, { name: "image", label: "Image", type: "image" }],
  },
  { name: "agentCommerceEnabled", label: "Allow AI assistants to quote and book", type: "boolean", half: true, section: "AI agent commerce", help: "Claude, ChatGPT, Gemini and other assistants connect at /api/mcp" },
  { name: "currencyCode", label: "Currency code (ISO)", type: "text", half: true, section: "AI agent commerce", help: "e.g. INR. Package prices are in this currency." },
  { name: "agentMaxDiscountPct", label: "Max negotiable discount %", type: "number", half: true, section: "AI agent commerce", help: "Private floor below list price (can be overridden per package)" },
  { name: "agentMaxRounds", label: "Negotiation rounds per quote", type: "number", half: true, section: "AI agent commerce", help: "0 means fixed prices" },
  { name: "agentQuoteValidityHours", label: "Quote valid for (hours)", type: "number", half: true, section: "AI agent commerce" },
  { name: "agentTaxPct", label: "Tax %", type: "number", half: true, section: "AI agent commerce" },
  { name: "agentTaxLabel", label: "Tax label", type: "text", half: true, section: "AI agent commerce", help: "e.g. GST" },
  {
    name: "agentVolumeTiers", label: "Group discounts (per-guest packages)", type: "list", section: "AI agent commerce",
    fields: [{ name: "min", label: "From guests", type: "number" }, { name: "pct", label: "Discount %", type: "number" }],
  },
  {
    name: "agentEarlyTiers", label: "Early-booking discounts", type: "list", section: "AI agent commerce",
    fields: [{ name: "min", label: "Booked at least (days ahead)", type: "number" }, { name: "pct", label: "Discount %", type: "number" }],
  },
  {
    name: "agentPerks", label: "Complimentary extras in quotes", type: "list", section: "AI agent commerce",
    fields: [{ name: "min", label: "From price (ex-tax)", type: "number" }, { name: "perk", label: "Extra", type: "text" }],
  },
];

export function slugify(s: string) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
