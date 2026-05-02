import { useEffect, useRef, useState } from "react";

export type PendingLeaveAction =
  | { type: "browser-back" }
  | { type: "link"; href: string }
  | null;

export function useBuilderLeaveGuard(hasUnsavedDraftChanges: boolean) {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<PendingLeaveAction>(null);
  const hasHistoryGuardRef = useRef(false);
  const bypassLeaveGuardRef = useRef(false);

  useEffect(() => {
    if (!hasUnsavedDraftChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassLeaveGuardRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedDraftChanges]);

  useEffect(() => {
    if (!hasUnsavedDraftChanges) {
      hasHistoryGuardRef.current = false;
      return;
    }

    if (!hasHistoryGuardRef.current) {
      window.history.pushState({ surveyBuilderGuard: true }, "", window.location.href);
      hasHistoryGuardRef.current = true;
    }

    const handlePopState = () => {
      window.history.pushState({ surveyBuilderGuard: true }, "", window.location.href);
      setPendingLeaveAction({ type: "browser-back" });
      setIsLeaveDialogOpen(true);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (bypassLeaveGuardRef.current) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.target && anchor.target !== "_self") return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.href === window.location.href) return;

      event.preventDefault();
      setPendingLeaveAction({ type: "link", href: destination.href });
      setIsLeaveDialogOpen(true);
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasUnsavedDraftChanges]);

  const handleConfirmLeave = () => {
    if (!pendingLeaveAction) {
      setIsLeaveDialogOpen(false);
      return;
    }

    bypassLeaveGuardRef.current = true;
    setIsLeaveDialogOpen(false);
    const action = pendingLeaveAction;
    setPendingLeaveAction(null);

    if (action.type === "browser-back") {
      hasHistoryGuardRef.current = false;
      window.history.back();
      return;
    }

    window.location.assign(action.href);
  };

  const handleStayOnPage = () => {
    setIsLeaveDialogOpen(false);
    setPendingLeaveAction(null);
  };

  return {
    isLeaveDialogOpen,
    setIsLeaveDialogOpen,
    handleConfirmLeave,
    handleStayOnPage,
  };
}
