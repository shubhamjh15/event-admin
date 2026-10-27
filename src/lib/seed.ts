import bcrypt from "bcryptjs";
import * as M from "./models";
import * as D from "./seed-data";

export async function seedContent() {
  await Promise.all([
    M.Settings.create({ key: "site", data: D.settings }),
    M.EventCategory.insertMany(D.categories),
    M.Event.insertMany(D.events.map((e, i) => ({ ...e, order: i + 1 }))),
    M.Destination.insertMany(D.destinations),
    M.Service.insertMany(D.services),
    M.Banner.insertMany(D.banners),
    M.GalleryItem.insertMany(D.gallery),
    M.TeamMember.insertMany(D.team),
    M.Testimonial.insertMany(D.testimonials),
    M.Faq.insertMany(D.faqs),
    M.Milestone.insertMany(D.milestones),
    M.Blog.insertMany(D.blogs),
    M.Comment.insertMany(D.comments),
    M.PageSeo.insertMany(D.pageSeo),
    M.Enquiry.insertMany(demoEnquiries()),
    M.Booking.insertMany([
      { kind: "appointment", name: "Kevin Brooks", email: "kevin@example.com", phone: "+1 555 0110", eventDate: "2026-11-04", time: "11:00", mode: "Video call", message: "Consultation for 40th birthday.", status: "confirmed" },
      { kind: "booking", name: "Ana Lopez", email: "ana@example.com", phone: "+1 555 0111", eventPackage: "mediterranean-celebration-cruise", eventDate: "2027-06-01", guests: "24", paymentMethod: "Credit Card", status: "pending" },
    ]),
  ]);
}

const DEMO_PEOPLE = [
  ["Sarah Williams", "Destination Weddings", "250", "$100k – $250k", "Jaipur", "Looking for a palace wedding in Jaipur for Feb 2027."],
  ["Acme Corp — HR", "Incentives", "80", "$250k+", "Maldives", "Incentive trip for our top 80 sales reps."],
  ["Daniel Price", "Birthdays", "120", "$25k – $50k", "New York", "Surprise 50th birthday gala for my wife."],
  ["Meera & Rohan", "Weddings", "400", "$100k – $250k", "Udaipur", "Three-day wedding with sangeet and reception."],
  ["Northwind Traders", "Corporate Meetings", "300", "$100k – $250k", "Dubai", "Annual leadership summit."],
  ["The Garcia Family", "Family Reunions", "45", "$50k – $100k", "Tuscany", "Four-generation family reunion in a villa."],
  ["Lena Brooks", "Concerts", "600", "$100k – $250k", "Miami", "Private rooftop concert for a product launch."],
  ["Globex Sales", "Sales Force Trainings", "900", "$250k+", "Las Vegas", "Sales kick-off with awards night."],
  ["Hannah Lee", "Cruises", "30", "$50k – $100k", "Mediterranean", "Anniversary cruise with family and friends."],
  ["Omar Haddad", "Group Travel", "18", "$25k – $50k", "Bali", "Friends' getaway for a 40th."],
  ["Priya Nair", "Destination Weddings", "180", "$100k – $250k", "Santorini", "Clifftop wedding with yacht after-party."],
  ["Initech", "Incentives", "60", "$250k+", "Amalfi Coast", "President's club trip."],
  ["Chloe Martin", "Weddings", "220", "$50k – $100k", "Chicago", "Ballroom wedding, need menu tasting."],
  ["Jake Turner", "Birthdays", "60", "Under $25k", "Austin", "Sweet sixteen for my daughter."],
];
const STATUSES = ["won", "proposal-sent", "contacted", "won", "lost", "contacted", "proposal-sent", "won", "new", "contacted", "new", "proposal-sent", "new", "new"];

function demoEnquiries() {
  const now = Date.now();
  return DEMO_PEOPLE.map(([name, eventType, guests, budget, destination, message], i) => {
    const daysAgo = Math.round(((DEMO_PEOPLE.length - 1 - i) / (DEMO_PEOPLE.length - 1)) * 170);
    const createdAt = new Date(now - daysAgo * 86400000);
    const eventDate = new Date(createdAt.getTime() + 200 * 86400000).toISOString().slice(0, 10);
    const slug = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
    return {
      name, eventType, guests, budget, destination, message, eventDate,
      email: `${slug}@example.com`, phone: `+1 555 01${String(i).padStart(2, "0")}`,
      source: ["home", "events", "contact", "about"][i % 4], status: STATUSES[i], createdAt, updatedAt: createdAt,
    };
  });
}

export async function ensureAdmin() {
  if ((await M.AdminUser.countDocuments()) > 0) return;
  const email = (process.env.ADMIN_EMAIL || "admin@litconcierge.com").toLowerCase();
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "LitAdmin@1989", 10);
  await M.AdminUser.create({ name: "Administrator", email, passwordHash });
}

export async function seedIfEmpty() {
  await ensureAdmin();
  if ((await M.Settings.countDocuments()) === 0) await seedContent();
}

/** Wipe all content (not admin users or media) and re-seed demo data. */
export async function resetContent() {
  const keep = new Set(["AdminUser", "Media"]);
  for (const m of Object.values(M)) {
    if (typeof m === "function" && "deleteMany" in m && !keep.has((m as any).modelName)) await (m as any).deleteMany({});
  }
  await seedContent();
}
