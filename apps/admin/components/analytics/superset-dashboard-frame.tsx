"use client";

import { useState } from "react";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function SupersetDashboardFrame({ src }: { src: string | null }) {
  const t = useTranslations("analytics.detailed");
  const [frameKey, setFrameKey] = useState(0);
  const [loading, setLoading] = useState(Boolean(src));

  if (!src) {
    return (
      <section className="flex min-h-[28rem] items-center justify-center rounded-xl border border-dashed border-primary/25 bg-card px-6 text-center">
        <div className="max-w-lg">
          <h2 className="text-base font-semibold">{t("notConfiguredTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("notConfiguredDescription")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-primary/15 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129_/_0.12)]"
          />
          <div>
            <h2 className="text-sm font-semibold">{t("liveDashboard")}</h2>
            <p className="text-xs text-muted-foreground">{t("readOnlyHint")}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={() => {
            setLoading(true);
            setFrameKey((current) => current + 1);
          }}
        >
          <RefreshCwIcon className="size-4" />
          {t("refresh")}
        </Button>
      </div>

      <div className="relative min-h-[42rem] bg-muted/20">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              {t("loading")}
            </div>
          </div>
        ) : null}

        <iframe
          key={frameKey}
          src={src}
          title={t("frameTitle")}
          className="h-[calc(100dvh-15rem)] min-h-[42rem] w-full border-0 bg-background"
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          allow="fullscreen; clipboard-read; clipboard-write"
          onLoad={() => setLoading(false)}
        />
      </div>
    </section>
  );
}
