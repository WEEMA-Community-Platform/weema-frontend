"use client";

import { CheckIcon, GlobeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLocale } from "@/app/actions/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

function useLocaleChanger() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const currentLocale = useLocale() as Locale;

  const change = (locale: Locale) => {
    if (locale === currentLocale) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  };

  return { currentLocale, change, isPending };
}

export function LanguageSwitcherButton({ className }: { className?: string }) {
  const t = useTranslations("common.language");
  const { currentLocale, change, isPending } = useLocaleChanger();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            className={cn(
              "h-8 gap-2 rounded-lg border-border/60 bg-card/60 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground",
              className
            )}
            aria-label={t("label")}
          />
        }
      >
        <GlobeIcon className="size-3.5 opacity-80" />
        <span className="uppercase tracking-wide">{currentLocale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="min-w-40 rounded-xl border border-border/60 bg-popover p-1 shadow-lg"
      >
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => change(locale)}
            className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm"
          >
            <span>{localeLabels[locale]}</span>
            {currentLocale === locale && (
              <CheckIcon className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSwitcherSubMenu() {
  const t = useTranslations("common.language");
  const { currentLocale, change, isPending } = useLocaleChanger();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        disabled={isPending}
        className="flex items-center gap-2"
      >
        <GlobeIcon className="size-4 opacity-80" />
        <span className="flex-1">{t("label")}</span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {currentLocale}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-40 rounded-xl border border-border/60 bg-popover p-1 shadow-lg">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => change(locale)}
            className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm"
          >
            <span>{localeLabels[locale]}</span>
            {currentLocale === locale && (
              <CheckIcon className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
