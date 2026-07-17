import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarNav } from "@/components/SidebarNav";
import db from "@/lib/db/client";
import { getDemoOrg } from "@/lib/web/queries";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = { title: "AI Executive Daily Brief — Northbound Supply Co.", description: "Daily executive brief for Northbound Supply Co." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const org = getDemoOrg(db);
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}><body className="min-h-full"><div className="flex min-h-screen flex-col md:flex-row"><aside className="w-full shrink-0 border-b border-border bg-surface md:w-56 md:border-b-0 md:border-r"><div className="px-3 py-4 text-sm font-semibold">{org.name}</div><SidebarNav /></aside><main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-6xl mx-auto w-full">{children}</main></div></body></html>;
}
