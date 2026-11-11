"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Save, Trash2, Mail, Phone, Send, Globe, EyeOff, FlaskConical } from "lucide-react";
import { resourceMap, type Field } from "@/lib/resources";
import { FieldInput, ReadOnlyValue, SeoPreview } from "./fields";
import { toast } from "./toast";

const DEFAULTS: Record<string, any> = { active: true, published: true, featured: false, approved: true, rating: 5, mediaType: "image", kind: "booking" };

export function FieldGrid({ fields, values, set }: { fields: Field[]; values: any; set: (k: string, v: any) => void }) {
  const sections = Array.from(new Set(fields.map((f) => f.section || "Details")));
  return (
    <div className="space-y-6">
      {sections.map((sec) => {
        const list = fields.filter((f) => (f.section || "Details") === sec);
        const isSeo = sec === "SEO";
        return (
          <section key={sec} className="rounded-3xl bg-white p-6 ring-1 ring-ink/5 md:p-8">
            <h2 className="mb-6 font-display text-xl font-semibold">{sec === "SEO" ? "SEO & social sharing" : sec}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {list.map((f) => (
                <div key={f.name} className={f.half ? "" : "md:col-span-2"}>
                  <label className="label-lux">{f.label}{f.required && <span className="text-rose"> *</span>}</label>
                  {f.readOnly ? <ReadOnlyValue field={f} value={values[f.name]} /> : <FieldInput field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} all={values} />}
                  {f.help && <p className="mt-1.5 text-xs text-ink-mute">{f.help}</p>}
                </div>
              ))}
              {isSeo && (
                <div className="md:col-span-2">
                  <SeoPreview title={values.seoTitle || values.title} description={values.seoDescription || values.summary || values.excerpt} />
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function ResourceForm({ resourceKey, id }: { resourceKey: string; id: string }) {
  const resource = resourceMap[resourceKey];
  const router = useRouter();
  const isNew = id === "new";
  const [values, setValues] = useState<any>(() =>
    Object.fromEntries(resource.fields.filter((f) => f.name in DEFAULTS).map((f) => [f.name, DEFAULTS[f.name]])),
  );
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/r/${resourceKey}/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setValues(d.item))
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [resourceKey, id, isNew]);

  const set = (k: string, v: any) => {
    setDirty(true);
    setValues((x: any) => ({ ...x, [k]: v }));
  };

  /** Save the form; `overrides` lets action buttons (e.g. Publish) change fields in the same request. */
  async function persist(overrides: Record<string, any> = {}, message = "Saved successfully") {
    const body = { ...values, ...overrides };
    const missing = resource.fields.find((f) => f.required && f.type !== "slug" && !body[f.name]);
    if (missing) { toast(`${missing.label} is required`, "error"); return false; }
    setSaving(true);
    let res: Response;
    try {
      res = await fetch(isNew ? `/api/admin/r/${resourceKey}` : `/api/admin/r/${resourceKey}/${id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setSaving(false);
      toast("Network error — changes not saved", "error");
      return false;
    }
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast(data.error || "Save failed", "error"); return false; }
    setDirty(false);
    toast(message);
    if (isNew) router.replace(`/admin/${resourceKey}/${data.item._id}`);
    else setValues(data.item);
    return true;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await persist();
  }

  async function remove() {
    if (!confirm("Delete permanently?")) return;
    const res = await fetch(`/api/admin/r/${resourceKey}/${id}`, { method: "DELETE" });
    if (res.ok) { toast("Deleted"); router.replace(`/admin/${resourceKey}`); }
  }

  if (loading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-rose" /></div>;
  if (missing) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center ring-1 ring-ink/5">
        <p className="font-display text-2xl font-semibold">Record not found</p>
        <p className="mt-2 text-sm text-ink-mute">It may have been deleted.</p>
        <Link href={`/admin/${resourceKey}`} className="btn-dark mt-6">Back to {resource.label}</Link>
      </div>
    );
  }
  const title = values.title || values.name || values.question || values.page || values.email || `New ${resource.singular.toLowerCase()}`;

  return (
    <form onSubmit={save} className="mx-auto max-w-5xl space-y-6">
      <div className="sticky top-16 z-20 -mx-5 flex flex-wrap items-center gap-3 border-b border-ink/5 bg-[#F6F3F8]/90 px-5 py-4 backdrop-blur md:-mx-8 md:px-8">
        <Link href={`/admin/${resourceKey}`} className="grid h-10 w-10 place-items-center rounded-xl bg-white ring-1 ring-ink/10 hover:ring-rose" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">{resource.label}</p>
          <h1 className="truncate font-display text-2xl font-semibold">{isNew ? `New ${resource.singular.toLowerCase()}` : title}</h1>
        </div>
        {!isNew && resource.publicPath && values.slug && (
          <a href={resource.publicPath(values)} target="_blank" className="btn-soft !py-2.5"><ExternalLink className="h-4 w-4" /> View</a>
        )}
        {!isNew && <button type="button" onClick={remove} className="btn !py-2.5 text-rose hover:bg-rose/10"><Trash2 className="h-4 w-4" /> Delete</button>}
        <button disabled={saving} className="btn-lit !py-2.5">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
      </div>

      {!isNew && (resourceKey === "enquiries" || resourceKey === "bookings") && (
        <div className="flex flex-wrap gap-3 rounded-3xl bg-ink p-5 text-white">
          <p className="mr-auto self-center text-sm text-white/70">Received {new Date(values.createdAt).toLocaleString()}</p>
          {values.email && <a href={`mailto:${values.email}`} className="btn-ghost !py-2"><Mail className="h-4 w-4" /> Email {values.name?.split(" ")[0]}</a>}
          {values.phone && <a href={`tel:${values.phone}`} className="btn-ghost !py-2"><Phone className="h-4 w-4" /> Call</a>}
        </div>
      )}

      {resourceKey === "blogs" && (
        <BlogActions
          id={isNew ? null : id}
          published={values.published !== false}
          dirty={dirty}
          saving={saving}
          onPublish={(on) => persist(on ? { published: true, publishedAt: values.publishedAt || new Date().toISOString().slice(0, 10) } : { published: false }, on ? "Published — the post is live" : "Moved back to draft")}
          onSave={() => persist()}
        />
      )}

      <FieldGrid fields={resource.fields} values={values} set={set} />
    </form>
  );
}

/** Blog-only bar: publish / unpublish, and push the post to newsletter subscribers. */
function BlogActions({ id, published, dirty, saving, onPublish, onSave }: { id: string | null; published: boolean; dirty: boolean; saving: boolean; onPublish: (on: boolean) => Promise<boolean>; onSave: () => Promise<boolean> }) {
  const [info, setInfo] = useState<{ subscribers: number; mailConfigured: boolean; pushedAt: string | null; pushedCount: number } | null>(null);
  const [busy, setBusy] = useState<"" | "push" | "test">("");

  const load = () => {
    if (!id) return;
    fetch(`/api/admin/newsletter?blog=${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setInfo(d)).catch(() => {});
  };
  useEffect(load, [id]);

  async function push(test: boolean) {
    if (!id) return;
    if (dirty && !(await onSave())) return;
    if (!test) {
      const again = info?.pushedAt ? `\n\nNote: this post was already pushed on ${new Date(info.pushedAt).toLocaleString()}.` : "";
      if (!confirm(`Email this post to ${info?.subscribers ?? 0} subscriber${info?.subscribers === 1 ? "" : "s"} now?${again}`)) return;
    }
    setBusy(test ? "test" : "push");
    try {
      const res = await fetch("/api/admin/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blogId: id, test }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) toast(d.error || "Sending failed", "error");
      else if (test) toast("Test email sent to the admin inbox");
      else toast(`Sent to ${d.sent} subscriber${d.sent === 1 ? "" : "s"}${d.failed ? ` · ${d.failed} failed` : ""}${d.remaining ? ` · ${d.remaining} not reached (time limit) — push again to continue` : ""}`, d.failed ? "error" : "ok");
    } catch {
      toast("Network error — nothing was sent", "error");
    }
    setBusy("");
    load();
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-5 ring-1 ring-ink/10">
      <div className="mr-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Status</p>
        <p className="mt-1 flex items-center gap-2 font-semibold">
          <span className={`h-2 w-2 rounded-full ${published ? "bg-emerald-500" : "bg-amber-500"}`} />
          {published ? "Published" : "Draft — not visible on the website"}
        </p>
        {id && info && (
          <p className="mt-1 text-xs text-ink-mute">
            {info.pushedAt ? `Pushed to ${info.pushedCount} subscribers on ${new Date(info.pushedAt).toLocaleString()}` : "Not pushed to subscribers yet"} · {info.subscribers} active subscriber{info.subscribers === 1 ? "" : "s"}
            {!info.mailConfigured && <span className="text-rose"> · Email isn't configured (SMTP settings missing)</span>}
          </p>
        )}
        {!id && <p className="mt-1 text-xs text-ink-mute">Save the post first to enable publishing and newsletter push.</p>}
      </div>
      {id && (
        <>
          <button type="button" disabled={saving} onClick={() => onPublish(!published)} className={published ? "btn-soft !py-2.5" : "btn-dark !py-2.5"}>
            {published ? <><EyeOff className="h-4 w-4" /> Unpublish</> : <><Globe className="h-4 w-4" /> Publish</>}
          </button>
          <button type="button" disabled={!!busy || !info?.mailConfigured} onClick={() => push(true)} className="btn-soft !py-2.5" title="Send a preview to the admin inbox">
            {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} Send test
          </button>
          <button type="button" disabled={!!busy || !published || !info?.mailConfigured || !info?.subscribers} onClick={() => push(false)} className="btn-lit !py-2.5" title={!published ? "Publish the post first" : undefined}>
            {busy === "push" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Push to subscribers
          </button>
        </>
      )}
    </div>
  );
}
