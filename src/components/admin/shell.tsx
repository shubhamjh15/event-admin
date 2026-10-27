"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Inbox, CalendarCheck, Mail, PartyPopper, Shapes, MapPin, Sparkles, GalleryHorizontal, Images, Newspaper, MessageSquare,
  Users, Quote, HelpCircle, Milestone, Search, Settings, LogOut, ExternalLink, Menu, X,
} from "lucide-react";
import { resources } from "@/lib/resources";
import { Toaster } from "./toast";

const ICONS: Record<string, any> = { Inbox, CalendarCheck, Mail, PartyPopper, Shapes, MapPin, Sparkles, GalleryHorizontal, Images, Newspaper, MessageSquare, Users, Quote, HelpCircle, Milestone, Search };

const groups = ["CRM", "Catalogue", "Media", "Content", "Company", "Settings"];

export function AdminShell({ user, children }: { user: { name: string; email: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const link = (href: string, label: string, Icon: any) => {
    const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
    return (
      <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
        <Icon className={`h-4 w-4 ${active ? "text-saffron" : ""}`} /> {label}
        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-lit" />}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-3 py-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
          <svg viewBox="0 0 64 64" className="h-6 w-6"><defs><linearGradient id="al" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E23E7D" /><stop offset=".5" stopColor="#F7931E" /><stop offset="1" stopColor="#E9CF8E" /></linearGradient></defs><path d="M32 6c5 10 15 15 15 28a15 15 0 0 1-30 0c0-8 4-12 6-15 1 5 4 8 6 8-1-8 0-14 3-21z" fill="url(#al)" /></svg>
        </span>
        <span>
          <span className="block font-display text-lg font-semibold text-white"><em className="text-lit">Lit</em> Concierge</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Admin control</span>
        </span>
      </Link>
      <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-2 pb-6">
        <div>{link("/admin", "Dashboard", LayoutDashboard)}</div>
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{g}</p>
            <div className="space-y-0.5">
              {resources.filter((r) => r.group === g).map((r) => link(`/admin/${r.key}`, r.label, ICONS[r.icon] || Sparkles))}
              {g === "Settings" && link("/admin/settings", "Site Settings", Settings)}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-lit text-sm font-bold text-white">{user.name[0]?.toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
            <span className="block truncate text-xs text-white/40">{user.email}</span>
          </span>
          <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white" aria-label="Log out" title="Log out"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F3F8]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink lg:block">{sidebar}</aside>
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-ink/50 transition ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 w-72 bg-ink transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</aside>
      </div>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink/5 bg-white/80 px-5 backdrop-blur-xl md:px-8">
          <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-xl bg-ink/5 lg:hidden" aria-label="Menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          <p className="text-sm font-medium text-ink-mute">Welcome back, <span className="font-semibold text-ink">{user.name}</span></p>
          <Link href="/" target="_blank" className="ml-auto inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink-soft">
            View website <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </header>
        <main className="p-5 md:p-8">{children}</main>
        <Toaster />
      </div>
    </div>
  );
}
