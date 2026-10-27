"use client";
import { useEffect, useState } from "react";
import { Loader2, Save, KeyRound, RotateCcw, Instagram, Facebook, Linkedin, Youtube } from "lucide-react";
import { settingsFields } from "@/lib/resources";
import { FieldGrid } from "@/components/admin/resource-form";
import { toast } from "@/components/admin/toast";

export default function SettingsPage() {
  const [values, setValues] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", name: "", email: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => setValues(d.item));
  }, []);
  const set = (k: string, v: any) => setValues((x: any) => ({ ...x, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    setSaving(false);
    if (res.ok) { setValues((await res.json()).item); toast("Settings saved"); } else toast("Save failed", "error");
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    const res = await fetch("/api/admin/account", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pw) });
    const d = await res.json().catch(() => ({}));
    setPwSaving(false);
    if (res.ok) { toast("Account updated"); setPw({ currentPassword: "", newPassword: "", name: "", email: "" }); } else toast(d.error || "Failed", "error");
  }

  async function reset() {
    if (!confirm("Reset ALL website content to the demo data? Enquiries, bookings, events, blogs etc. will be replaced. Admin accounts and uploads are kept.")) return;
    const res = await fetch("/api/admin/reset", { method: "POST" });
    if (res.ok) { toast("Demo content restored"); location.reload(); } else toast("Reset failed", "error");
  }

  if (!values) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-rose" /></div>;
  const socials = [["instagram", Instagram], ["facebook", Facebook], ["linkedin", Linkedin], ["youtube", Youtube]] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <form onSubmit={save} className="space-y-6">
        <div className="sticky top-16 z-20 -mx-5 flex items-center gap-3 border-b border-ink/5 bg-[#F6F3F8]/90 px-5 py-4 backdrop-blur md:-mx-8 md:px-8">
          <div className="flex-1">
            <h1 className="font-display text-3xl font-semibold">Site settings</h1>
            <p className="text-sm text-ink-mute">Brand, contact details, home hero video, about content and trust badges.</p>
          </div>
          <button disabled={saving} className="btn-lit !py-2.5">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
        </div>
        <FieldGrid fields={settingsFields} values={values} set={set} />
        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5 md:p-8">
          <h2 className="mb-6 font-display text-xl font-semibold">Social links</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {socials.map(([k, I]) => (
              <label key={k} className="block">
                <span className="label-lux flex items-center gap-1.5"><I className="h-3.5 w-3.5" /> {k}</span>
                <input value={values.socials?.[k] || ""} onChange={(e) => set("socials", { ...values.socials, [k]: e.target.value })} className="input-lux" placeholder="https://" />
              </label>
            ))}
          </div>
        </section>
      </form>

      <form onSubmit={savePassword} className="rounded-3xl bg-white p-6 ring-1 ring-ink/5 md:p-8">
        <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-semibold"><KeyRound className="h-5 w-5 text-rose" /> Admin account</h2>
        <p className="mb-6 text-sm text-ink-mute">Change your name, login email or password. Current password is required.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="label-lux">Display name</span><input value={pw.name} onChange={(e) => setPw({ ...pw, name: e.target.value })} className="input-lux" placeholder="Leave blank to keep" /></label>
          <label><span className="label-lux">Login email</span><input type="email" value={pw.email} onChange={(e) => setPw({ ...pw, email: e.target.value })} className="input-lux" placeholder="Leave blank to keep" /></label>
          <label><span className="label-lux">Current password *</span><input type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className="input-lux" /></label>
          <label><span className="label-lux">New password (min 8)</span><input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className="input-lux" /></label>
        </div>
        <button disabled={pwSaving} className="btn-dark mt-6">{pwSaving && <Loader2 className="h-4 w-4 animate-spin" />} Update account</button>
      </form>

      <section className="rounded-3xl border border-rose/30 bg-rose/5 p-6 md:p-8">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-rose"><RotateCcw className="h-5 w-5" /> Danger zone</h2>
        <p className="mt-1 text-sm text-ink-soft">Restore all website content to the original demo data. Useful for staging environments.</p>
        <button type="button" onClick={reset} className="btn mt-5 bg-rose text-white hover:bg-rose/90">Reset demo content</button>
      </section>
    </div>
  );
}
