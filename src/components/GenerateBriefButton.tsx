"use client";

import { useState, useTransition } from "react";
import { generateTodaysBrief } from "@/app/actions/generate-brief";
import { ErrorState } from "@/components/ErrorState";

export function GenerateBriefButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function handleClick() {
    setError(null);
    startTransition(() => {
      generateTodaysBrief().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)));
    });
  }
  return <div><button type="button" onClick={handleClick} disabled={isPending} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{isPending ? "Generating…" : "Generate Today's Brief"}</button>{error ? <ErrorState title="Could not generate brief" description={error} /> : null}</div>;
}
