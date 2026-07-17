import type { ReactNode } from "react";
export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) { return <div className={`bg-surface border border-border rounded-lg p-4 md:p-6 ${className ?? ""}`}>{title ? <h3 className="text-sm font-medium text-muted mb-3">{title}</h3> : null}{children}</div>; }
