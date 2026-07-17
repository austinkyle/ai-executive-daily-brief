"use client";

export function PrintButton() { return <div className="no-print"><button type="button" onClick={() => window.print()} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Print / Save as PDF</button></div>; }
