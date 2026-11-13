"use client";

import { createContext, useContext, useState, type PropsWithChildren } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sileo } from "sileo";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmailExportRequiredError, requestEmailExport } from "@/lib/api/export";

type EmailExportJob = { path: string; rowCount: number };
type PendingExport = {
  jobs: EmailExportJob[];
  /** For combined survey exports, download the smaller surveys after email requests succeed. */
  onAccepted?: () => void;
  hasLocalDownload?: boolean;
};

type EmailExportContextValue = {
  offerRequiredExport: (error: unknown, path: string) => boolean;
  offerEmailExports: (jobs: EmailExportJob[], options?: Pick<PendingExport, "onAccepted" | "hasLocalDownload">) => void;
};

const EmailExportContext = createContext<EmailExportContextValue | null>(null);

export function useEmailExportConfirmation() {
  const context = useContext(EmailExportContext);
  if (!context) throw new Error("EmailExportProvider is missing");
  return context;
}

export function EmailExportProvider({ children }: PropsWithChildren) {
  const t = useTranslations("exportDelivery");
  const locale = useLocale();
  const [pending, setPending] = useState<PendingExport | null>(null);
  const [sending, setSending] = useState(false);

  const offerEmailExports: EmailExportContextValue["offerEmailExports"] = (jobs, options) => {
    if (jobs.length === 0) return;
    setPending({ jobs, ...options });
  };

  const offerRequiredExport: EmailExportContextValue["offerRequiredExport"] = (error, path) => {
    if (!(error instanceof EmailExportRequiredError)) return false;
    offerEmailExports([{ path, rowCount: error.rowCount }]);
    return true;
  };

  const confirm = async () => {
    if (!pending || sending) return;
    setSending(true);
    let accepted = 0;
    try {
      for (const job of pending.jobs) {
        await requestEmailExport(job.path);
        accepted++;
      }
    } catch (error) {
      if (accepted > 0) {
        setPending({ ...pending, jobs: pending.jobs.slice(accepted) });
      }
      sileo.error({
        title: t("failedTitle"),
        description: accepted > 0
          ? t("partialDescription", { count: accepted })
          : error instanceof Error ? error.message : t("failedDescription"),
      });
      setSending(false);
      return;
    }

    setSending(false);
    setPending(null);
    sileo.success({
      title: t("queuedTitle"),
      description: pending.jobs.length === 1
        ? t("queuedDescription")
        : t("queuedMultipleDescription", { count: pending.jobs.length }),
    });
    try {
      pending.onAccepted?.();
    } catch {
      sileo.error({
        title: t("localDownloadFailedTitle"),
        description: t("localDownloadFailedDescription"),
      });
    }
  };

  const totalRows = pending?.jobs.reduce((total, job) => total + job.rowCount, 0) ?? 0;
  const formattedRows = new Intl.NumberFormat(locale).format(totalRows);

  return (
    <EmailExportContext.Provider value={{ offerRequiredExport, offerEmailExports }}>
      {children}
      <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open && !sending) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.jobs.length === 1
                ? t("singleDescription", { count: formattedRows })
                : t("multipleDescription", { count: formattedRows, files: pending?.jobs.length ?? 0 })}
              {pending?.hasLocalDownload ? ` ${t("localDownloadDescription")}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={sending} onClick={() => void confirm()}>
              {sending ? t("sending") : t("send")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EmailExportContext.Provider>
  );
}
