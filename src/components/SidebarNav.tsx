"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [{ href: "/", label: "Today's Brief" }, { href: "/scorecard", label: "Scorecard" }, { href: "/alerts", label: "Alerts" }, { href: "/history", label: "History" }, { href: "/sources", label: "Data Sources" }];
export function SidebarNav() { const pathname = usePathname(); return <nav className="px-3 pb-3">{links.map((link) => <Link key={link.href} href={link.href} className={`block rounded-md px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${pathname === link.href ? "bg-accent-soft text-accent font-medium" : "text-foreground hover:bg-surface"}`}>{link.label}</Link>)}</nav>; }
