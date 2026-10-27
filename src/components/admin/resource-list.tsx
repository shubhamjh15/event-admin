"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, ExternalLink, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { resourceMap, BOOKING_STATUS, ENQUIRY_STATUS } from "@/lib/resources";
import { StatusBadge } from "./badges";
import { toast } from "./toast";

export function ResourceList({ resourceKey }: { resourceKey: string }) {
  const resource = resourceMap[resourceKey];
  const router = useRouter();
  const sp = useSearchParams();
  const [data, setData] = useState<{ items: any[]; total: number; pages: number }>({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState(sp.get("q") || "");

  const qs = sp.toString();
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/r/${resourceKey}?${qs}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [resourceKey, qs]);
  useEffect(() => { load(); }, [load]);

  function setParam(key: string, value?: string) {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value); else p.delete(key);
    if (key !== "page") p.delete("page");
    router.replace(`/admin/${resourceKey}?${p.toString()}`);
  }

  async function patch(id: string, body: any) {
    const res = await fetch(`/api/admin/r/${resourceKey}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (res?.ok) {
      const { item } = await res.json();
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === id ? item : x)) }));
      toast("Updated");
    } else toast("Update failed", "error");
  }

  async function remove(id: string) {
    if (!confirm(`Delete this ${resource.singular.toLowerCase()}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/r/${resourceKey}/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) { toast("Deleted"); load(); } else toast("Delete failed", "error");
  }

  if (!resource) return <p>Unknown module.</p>;
  const page = Number(sp.get("page") || 1);
  const statusOptions = resourceKey === "enquiries" ? ENQUIRY_STATUS : resourceKey === "bookings" ? BOOKING_STATUS : null;

  const cell = (col: (typeof resource.columns)[number], item: any) => {
    const v = item[col.name];
    if (col.name === "status" && statusOptions) {
      return (
        <select value={v || ""} onClick={(e) => e.stopPropagation()} onChange={(e) => patch(item._id, { status: e.target.value })} className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold capitalize outline-none focus:border-rose">
          {statusOptions.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
        </select>
      );
    }
    switch (col.type) {
      case "image":
        return v ? <img src={v} alt="" className="h-12 w-16 rounded-xl object-cover" /> : <span className="block h-12 w-16 rounded-xl bg-ink/5" />;
      case "boolean":
        return (
          <button onClick={(e) => { e.stopPropagation(); patch(item._id, { [col.name]: !v }); }} className={`relative h-6 w-11 rounded-full transition ${v ? "bg-lit" : "bg-ink/15"}`} aria-label={`Toggle ${col.label}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${v ? "left-[22px]" : "left-0.5"}`} />
          </button>
        );
      case "badge":
        return <StatusBadge value={v} />;
      case "date":
        return v ? <span className="whitespace-nowrap text-ink-mute">{new Date(v).toLocaleDateString()}</span> : null;
      case "price":
        return v != null ? <span className="font-semibold">₹{Number(v).toLocaleString("en-IN")}</span> : null;
      default:
        return <span className="line-clamp-2 max-w-[320px]">{Array.isArray(v) ? v.join(", ") : String(v ?? "")}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl font-semibold">{resource.label}</h1>
          <p className="mt-1 text-ink-mute">{data.total} {data.total === 1 ? resource.singular.toLowerCase() : "records"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["enquiries", "bookings", "subscribers", "comments"].includes(resourceKey) && (
            <a href={`/api/admin/r/${resourceKey}?format=csv&${qs}`} className="btn-soft !py-2.5"><Download className="h-4 w-4" /> Export CSV</a>
          )}
          <Link href={`/admin/${resourceKey}/new`} className="btn-lit !py-2.5"><Plus className="h-4 w-4" /> Add {resource.singular.toLowerCase()}</Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 ring-1 ring-ink/5 md:flex-row md:items-center">
        <form onSubmit={(e) => { e.preventDefault(); setParam("q", q); }} className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${resource.label.toLowerCase()}…`} className="input-lux !rounded-full !py-2.5 pl-11" />
          {q && <button type="button" onClick={() => { setQ(""); setParam("q"); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-label="Clear"><X className="h-4 w-4" /></button>}
        </form>
        {resource.filters?.map((f) => (
          <select key={f.name} value={sp.get(f.name) || ""} onChange={(e) => setParam(f.name, e.target.value)} className="input-lux !w-auto !rounded-full !py-2.5 capitalize">
            <option value="">All {f.name}</option>
            {f.options.map((o) => <option key={o} value={o}>{f.name === "approved" ? (o === "true" ? "Approved" : "Pending") : o.replace(/-/g, " ")}</option>)}
          </select>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/5 bg-[#FBF9FC] text-[11px] font-bold uppercase tracking-wider text-ink-mute">
              <tr>
                {resource.columns.map((c) => <th key={c.name} className="whitespace-nowrap px-5 py-4">{c.label}</th>)}
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {loading ? (
                <tr><td colSpan={resource.columns.length + 1} className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-rose" /></td></tr>
              ) : error ? (
                <tr><td colSpan={resource.columns.length + 1} className="py-16 text-center">
                  <p className="text-ink-mute">Couldn't load {resource.label.toLowerCase()}.</p>
                  <button onClick={load} className="btn-soft mt-4 !py-2">Retry</button>
                </td></tr>
              ) : data.items.length === 0 ? (
                <tr><td colSpan={resource.columns.length + 1} className="py-16 text-center text-ink-mute">Nothing here yet.</td></tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item._id} onClick={() => router.push(`/admin/${resourceKey}/${item._id}`)} className="cursor-pointer transition hover:bg-ivory/60">
                    {resource.columns.map((c) => <td key={c.name} className="px-5 py-3 align-middle">{cell(c, item)}</td>)}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {resourceKey === "comments" && !item.approved && (
                          <button onClick={() => patch(item._id, { approved: true })} className="grid h-9 w-9 place-items-center rounded-xl text-emerald-600 hover:bg-emerald-50" title="Approve"><Check className="h-4 w-4" /></button>
                        )}
                        {resource.publicPath && (
                          <a href={resource.publicPath(item)} target="_blank" className="grid h-9 w-9 place-items-center rounded-xl text-ink-mute hover:bg-ink/5" title="View on site"><ExternalLink className="h-4 w-4" /></a>
                        )}
                        <Link href={`/admin/${resourceKey}/${item._id}`} className="grid h-9 w-9 place-items-center rounded-xl text-ink-mute hover:bg-ink/5" title="Edit"><Pencil className="h-4 w-4" /></Link>
                        <button onClick={() => remove(item._id)} className="grid h-9 w-9 place-items-center rounded-xl text-rose hover:bg-rose/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-ink/5 px-5 py-3 text-sm">
            <span className="text-ink-mute">Page {page} of {data.pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setParam("page", String(page - 1))} className="grid h-9 w-9 place-items-center rounded-xl ring-1 ring-ink/10 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              <button disabled={page >= data.pages} onClick={() => setParam("page", String(page + 1))} className="grid h-9 w-9 place-items-center rounded-xl ring-1 ring-ink/10 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
