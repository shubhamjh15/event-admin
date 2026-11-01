"use client";
import { useRef, useState } from "react";
import { Images, Loader2, X } from "lucide-react";
import { uploadMany } from "./fields";
import { toast } from "./toast";

/** Turn "IMG_2041-palace-mandap.jpg" into "Palace mandap". */
function titleFromFile(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/^(img|dsc|pxl|photo)[_-]?\d*[_-]?/i, "").replace(/[_-]+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Untitled";
}

/**
 * Bulk upload: pick or drop many images, give them a shared category, and one record is created per image.
 */
export function BulkUpload({ resourceKey, imageField, titleField, onDone }: { resourceKey: string; imageField: string; titleField?: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number; stage: string } | null>(null);
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const pick = (list: FileList | null) => {
    // Copy now: the live FileList empties as soon as the input is reset.
    const picked = Array.from(list || []).filter((x) => x.type.startsWith("image/"));
    setFiles((f) => [...f, ...picked]);
  };

  async function start() {
    if (!files.length) return;
    setProgress({ done: 0, total: files.length, stage: "Uploading" });
    const uploaded = await uploadMany(files, (done, total) => setProgress({ done, total, stage: "Uploading" }));
    let created = 0;
    for (const [i, u] of uploaded.entries()) {
      setProgress({ done: i, total: uploaded.length, stage: "Saving" });
      const body: Record<string, any> = { [imageField]: u.url, order: Date.now() % 100000 + i };
      if (titleField) body[titleField] = titleFromFile(u.file.name);
      if (category.trim()) body.category = category.trim();
      const res = await fetch(`/api/admin/r/${resourceKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
      if (res?.ok) created++;
    }
    setProgress(null);
    setFiles([]);
    setOpen(false);
    toast(`${created} item${created === 1 ? "" : "s"} added${created < files.length ? ` · ${files.length - created} skipped` : ""}`, created < files.length ? "error" : "ok");
    onDone();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-soft !py-2.5"><Images className="h-4 w-4" /> Bulk upload</button>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal aria-label="Bulk upload">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lux">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">Bulk upload</h2>
              <button type="button" disabled={!!progress} onClick={() => { setOpen(false); setFiles([]); }} className="grid h-9 w-9 place-items-center rounded-md hover:bg-ink/5" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 text-sm text-ink-mute">Each image becomes its own item. Captions are taken from file names — edit them later if you like. Max 4 MB per image.</p>

            <div
              onClick={() => ref.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
              className={`mt-5 grid cursor-pointer place-items-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${over ? "border-rose bg-rose/5" : "border-ink/15 hover:border-ink/40"}`}
            >
              <Images className="h-8 w-8 text-ink/30" />
              <p className="mt-3 font-semibold">Drop images here or click to choose</p>
              <p className="text-xs text-ink-mute">You can select many files at once</p>
            </div>
            <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />

            {files.length > 0 && (
              <div className="mt-4 grid max-h-48 grid-cols-6 gap-2 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={f.name + i} className="group relative aspect-square overflow-hidden rounded bg-[#F6F3F8]">
                    <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                    {!progress && (
                      <button type="button" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded bg-ink/70 text-white opacity-0 group-hover:opacity-100" aria-label={`Remove ${f.name}`}><X className="h-3 w-3" /></button>
                    )}
                    {f.size > 4 * 1024 * 1024 && <span className="absolute inset-x-0 bottom-0 bg-rose px-1 text-[9px] font-semibold text-white">Over 4 MB</span>}
                  </div>
                ))}
              </div>
            )}

            <label className="mt-5 block">
              <span className="label-lux">Category for all (optional)</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Weddings" className="input-lux" />
            </label>

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-mute">{progress ? `${progress.stage} ${progress.done}/${progress.total}…` : `${files.length} image${files.length === 1 ? "" : "s"} selected`}</p>
              <button type="button" disabled={!files.length || !!progress} onClick={start} className="btn-lit !py-2.5">
                {progress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Images className="h-4 w-4" />} Upload {files.length || ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
