// Reset all content to demo data: `npm run seed` (uses MONGODB_URI from .env.local)
import mongoose from "mongoose";
import { resetContent, ensureAdmin } from "../src/lib/seed";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env.local first");
  await mongoose.connect(uri);
  await ensureAdmin();
  await resetContent();
  console.log("✓ Seeded demo content");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
