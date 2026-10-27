"use client";
import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { ArrowDown, ArrowUp, Eye, Loader2, Pencil, Plus, Trash2, Upload, X, ImageIcon } from "lucide-react";
import type { Field } from "@/lib/resources";
import { slugify } from "@/lib/resources";
import { toast } from "./toast";

const optionsCache = new Map<string, Promise<any[]>>();
function loadOptions(resource: string) {
  if (!optionsCache.has(resource)) {
    optionsCache.set(resource, fetch(`/api/admin/r/${resource}?all=1`).then((r) => r.json()).then((d) => d.items || []));
  }
  return optionsCache.get(resource)!;
}

async function upload(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast(data.error || "Upload failed", "error");
    return null;
  }
  return data.url;
}

const isVideo = (url?: string) => !!url && /\.(mp4|webm|mov)(\?|$)/i.test(url);

function MediaInput({ value, onChange, video = false }: { value?: string; onChange: (v: string) => void; video?: boolean }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function onFile(f?: File) {
    if (!f) return;
    setBusy(true);
    const url = await upload(f);
    setBusy(false);
    if (url) { onChange(url); toast("Uploaded"); }
  }
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-dashed border-ink/15 bg-white p-3 sm:flex-row sm:items-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
    >
      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-[#F6F3F8] sm:w-36">
        {value ? (
          video || isVideo(value) ? <video src={value} muted playsInline className="h-full w-full object-cover" /> : <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-ink/20"><ImageIcon className="h-8 w-8" /></span>
        )}
        {busy && <span className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 className="h-5 w-5 animate-spin text-rose" /></span>}
      </div>
      <div className="flex-1 space-y-2">
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Paste a URL or upload / drop a file" className="input-lux !py-2.5" />
        <div className="flex gap-2">
          <button type="button" onClick={() => ref.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink-soft"><Upload className="h-3.5 w-3.5" /> Upload</button>
          {value && <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-rose hover:bg-rose/10"><X className="h-3.5 w-3.5" /> Remove</button>}
        </div>
        <input ref={ref} type="file" hidden accept={video ? "video/*,image/*" : "image/*,video/*"} onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
    </div>
  );
}

function TagsInput({ value = [], onChange }: { value?: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...value, ...parts.filter((p) => !value.includes(p))]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-white p-2 focus-within:border-rose focus-within:ring-4 focus-within:ring-rose/10">
      {value.map((t, i) => (
        <span key={t + i} className="chip bg-ivory-deep text-ink">
          {t}
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${t}`}><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder="Type and press Enter"
        className="min-w-[160px] flex-1 bg-transparent px-2 py-1.5 text-sm outline-none"
      />
    </div>
  );
}

function MarkdownInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="flex items-center gap-1 border-b border-ink/5 bg-[#FBF9FC] px-2 py-1.5 text-xs">
        <button type="button" onClick={() => setPreview(false)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold ${!preview ? "bg-white shadow-sm" : "text-ink-mute"}`}><Pencil className="h-3 w-3" /> Write</button>
        <button type="button" onClick={() => setPreview(true)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold ${preview ? "bg-white shadow-sm" : "text-ink-mute"}`}><Eye className="h-3 w-3" /> Preview</button>
        <span className="ml-auto pr-2 text-ink-mute">Markdown: ## Heading, **bold**, - list, &gt; quote</span>
      </div>
      {preview ? (
        <div className="prose-lux max-h-[520px] min-h-[240px] overflow-y-auto p-5 !text-base" dangerouslySetInnerHTML={{ __html: marked.parse((value || "").replace(/<(?=[a-zA-Z/!])/g, "&lt;"), { async: false }) as string }} />
      ) : (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={14} className="block w-full resize-y p-5 font-mono text-sm outline-none" />
      )}
    </div>
  );
}

function ListInput({ field, value = [], onChange }: { field: Field; value?: any[]; onChange: (v: any[]) => void }) {
  const set = (i: number, k: string, v: any) => onChange(value.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const move = (i: number, d: number) => {
    const next = [...value];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="rounded-2xl border border-ink/10 bg-[#FBF9FC] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="chip bg-lit text-white">#{i + 1}</span>
            <div className="flex gap-1">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-ink/5 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-ink/5 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-lg text-rose hover:bg-rose/10" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {field.fields!.map((sf) => (
              <div key={sf.name} className={sf.type === "textarea" || sf.type === "image" ? "md:col-span-2" : ""}>
                <span className="label-lux">{sf.label}</span>
                <FieldInput field={sf} value={row?.[sf.name]} onChange={(v) => set(i, sf.name, v)} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, {}])} className="inline-flex items-center gap-2 rounded-full border border-dashed border-rose/40 px-4 py-2.5 text-sm font-semibold text-rose hover:bg-rose/5">
        <Plus className="h-4 w-4" /> Add {field.label.toLowerCase().replace(/s$/, "")}
      </button>
    </div>
  );
}

function SelectInput({ field, value, onChange }: { field: Field; value: any; onChange: (v: any) => void }) {
  const [opts, setOpts] = useState<{ value: string; label: string }[]>(field.options?.map((o) => ({ value: o, label: o })) || []);
  useEffect(() => {
    const src = field.optionsFrom;
    if (!src) return;
    loadOptions(src.resource).then((items) => setOpts(items.map((i) => ({ value: i[src.value], label: i[src.label] }))));
  }, [field.optionsFrom]);
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input-lux capitalize">
      <option value="">— Select —</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function FieldInput({ field, value, onChange, all }: { field: Field; value: any; onChange: (v: any) => void; all?: any }) {
  switch (field.type) {
    case "textarea":
      return <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={4} className="input-lux resize-y" />;
    case "markdown":
      return <MarkdownInput value={value} onChange={onChange} />;
    case "number":
      return <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input-lux" />;
    case "date":
      return <input type="date" value={value ? String(value).slice(0, 10) : ""} onChange={(e) => onChange(e.target.value)} className="input-lux" />;
    case "email":
      return <input type="email" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input-lux" />;
    case "boolean":
      return (
        <button type="button" onClick={() => onChange(!value)} className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-medium">
          <span className={`relative h-6 w-11 rounded-full transition ${value ? "bg-lit" : "bg-ink/15"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
          </span>
          {value ? "Yes" : "No"}
        </button>
      );
    case "select":
      return <SelectInput field={field} value={value} onChange={onChange} />;
    case "tags":
      return <TagsInput value={value} onChange={onChange} />;
    case "image":
      return <MediaInput value={value} onChange={onChange} />;
    case "video":
      return <MediaInput value={value} onChange={onChange} video />;
    case "images": {
      const list: string[] = value || [];
      return (
        <div className="space-y-3">
          {list.map((src, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1"><MediaInput value={src} onChange={(v) => onChange(list.map((x, j) => (j === i ? v : x)))} /></div>
              <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="mt-3 grid h-9 w-9 place-items-center rounded-xl text-rose hover:bg-rose/10" aria-label="Remove image"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => onChange([...list, ""])} className="inline-flex items-center gap-2 rounded-full border border-dashed border-rose/40 px-4 py-2.5 text-sm font-semibold text-rose hover:bg-rose/5"><Plus className="h-4 w-4" /> Add image</button>
        </div>
      );
    }
    case "list":
      return <ListInput field={field} value={value} onChange={onChange} />;
    case "slug":
      return (
        <div className="flex gap-2">
          <input value={value ?? ""} onChange={(e) => onChange(slugify(e.target.value))} className="input-lux font-mono" />
          {all && (
            <button type="button" onClick={() => onChange(slugify(all.title || all.name || ""))} className="shrink-0 rounded-2xl bg-ink/5 px-4 text-xs font-semibold hover:bg-ink/10">Generate</button>
          )}
        </div>
      );
    default:
      return <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input-lux" />;
  }
}

/** Google-style search preview with length meters. */
export function SeoPreview({ title, description, path }: { title?: string; description?: string; path?: string }) {
  const meter = (len: number, min: number, max: number) => (len === 0 ? "bg-ink/10" : len < min ? "bg-saffron" : len > max ? "bg-rose" : "bg-emerald-500");
  const t = title || "";
  const d = description || "";
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <p className="label-lux">Search preview</p>
      <p className="truncate text-xs text-emerald-700">{(process.env.NEXT_PUBLIC_SITE_URL || "https://litconcierge.com") + (path || "")}</p>
      <p className="mt-1 truncate text-lg text-[#1a0dab]">{t || "Page title"}</p>
      <p className="line-clamp-2 text-sm text-ink-mute">{d || "Meta description will appear here."}</p>
      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        {[["Title", t.length, 30, 60], ["Description", d.length, 120, 160]].map(([l, len, min, max]: any) => (
          <div key={l}>
            <div className="flex justify-between text-ink-mute"><span>{l}</span><span>{len} / {max}</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/5"><div className={`h-full ${meter(len, min, max)}`} style={{ width: `${Math.min(100, (len / max) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
