"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AnalyticsViewNav } from "@/components/analytics/analytics-view-nav";

export function SupersetDashboardFrame({ src, embeddingBlocked = false }: { src: string | null; embeddingBlocked?: boolean }) {
  const t = useTranslations("analytics.detailed");
  const [frameKey, setFrameKey] = useState(0);
  const [loading, setLoading] = useState(Boolean(src));
  const [slow, setSlow] = useState(false);
  const frameContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = frameContainer.current;
    if (!element) return;
    const updateHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      element.style.height = `${Math.max(320, height - element.getBoundingClientRect().top - 8)}px`;
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (element.parentElement) observer.observe(element.parentElement);
    window.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("resize", updateHeight);
    };
  }, [src, embeddingBlocked]);

  useEffect(() => {
    if (!loading || embeddingBlocked) return;
    const timeout = window.setTimeout(() => setSlow(true), 15000);
    return () => window.clearTimeout(timeout);
  }, [loading, frameKey, embeddingBlocked]);

  if (!src) return <section className="py-12">
    <h2 className="text-base font-semibold">{t("notConfiguredTitle")}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{t("notConfiguredDescription")}</p>
  </section>;

  return (
    <section className="-mx-2 -mb-2 min-w-0 md:-mx-4 md:-mb-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <AnalyticsViewNav />
        <Button type="button" variant="ghost" className="h-10" onClick={() => {
          if (embeddingBlocked) { window.location.reload(); return; }
          setLoading(true); setSlow(false); setFrameKey((current) => current + 1);
        }}>
          <RefreshCwIcon className="size-4" />{t("refresh")}
        </Button>
      </div>
      {embeddingBlocked ? <div className="flex min-h-[24rem] items-center justify-center rounded-xl border border-border bg-card p-6">
        <div className="max-w-md text-center">
          <h2 className="text-base font-semibold">{t("blockedTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("blockedDescription")}</p>
        </div>
      </div> : <div ref={frameContainer} className="relative h-[calc(100dvh-10rem)] min-h-80 overflow-hidden rounded-xl border border-border bg-card" aria-busy={loading}>
        {loading ? <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-4">
          <p role="status" className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <Loader2Icon className="size-4 animate-spin motion-reduce:animate-none" />{t(slow ? "slowLoading" : "loading")}
          </p>
        </div> : null}
        <iframe key={frameKey} src={src} title={t("frameTitle")}
          className="block h-full w-full border-0 bg-background"
          loading="eager" referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-storage-access-by-user-activation"
          allow="fullscreen; clipboard-read; clipboard-write"
          onLoad={() => setLoading(false)} onError={() => { setLoading(true); setSlow(true); }} />
      </div>}
    </section>
  );
}
