"use client";

import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = "image/*,.pdf";

type BaseProps = {
  disabled?: boolean;
  isUploading?: boolean;
  variant?: "default" | "compact";
};

type UploadMode = BaseProps & {
  mode?: "upload";
  /** Called when the user confirms upload of the staged file. */
  onUpload: (file: File) => void | Promise<void>;
};

type PickMode = BaseProps & {
  mode: "pick";
  /** Fires when a file is chosen, replaced, or cleared. */
  onFileChange: (file: File | null) => void;
};

export type NationalIdDropzoneProps = UploadMode | PickMode;

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function NationalIdDropzone(props: NationalIdDropzoneProps) {
  const mode = props.mode ?? "upload";
  const disabled = props.disabled;
  const isUploading = props.isUploading;
  const variant = props.variant ?? "default";
  const compact = variant === "compact";
  const onPickFileChange = props.mode === "pick" ? props.onFileChange : undefined;

  const inputRef = useRef<HTMLInputElement>(null);
  const reactId = useId();
  const inputId = `national-id-${reactId}`;
  const [isDragging, setIsDragging] = useState(false);
  const [staged, setStaged] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const setStagedAndNotify = useCallback(
    (file: File | null) => {
      setStaged(file);
      setLocalError(null);
      onPickFileChange?.(file);
    },
    [onPickFileChange]
  );

  const pickFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setStagedAndNotify(file);
    },
    [setStagedAndNotify]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled || isUploading) return;
      pickFiles(e.dataTransfer.files);
    },
    [disabled, isUploading, pickFiles]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled && !isUploading) setIsDragging(true);
    },
    [disabled, isUploading]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const next = e.relatedTarget as Node | null;
    if (e.currentTarget.contains(next)) return;
    setIsDragging(false);
  }, []);

  const handleZoneKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const clearStaged = useCallback(() => {
    setStagedAndNotify(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [setStagedAndNotify]);

  const handleUploadClick = useCallback(async () => {
    if (mode !== "upload") return;
    if (!staged || disabled || isUploading) {
      setLocalError("Choose a file first.");
      return;
    }
    setLocalError(null);
    try {
      if ("onUpload" in props) {
        await props.onUpload(staged);
      }
      clearStaged();
    } catch {
      /* Parent shows toast; keep staged file for retry */
    }
  }, [mode, staged, disabled, isUploading, props, clearStaged]);

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3")}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || isUploading}
        onChange={(e) => pickFiles(e.target.files)}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label={
          mode === "pick"
            ? "National ID document. Drop a file or press Enter to browse."
            : "Upload national ID document. Drop a file or press Enter to browse."
        }
        aria-disabled={disabled || isUploading}
        onKeyDown={handleZoneKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled && !isUploading) inputRef.current?.click();
        }}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-[border-color,background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
          compact
            ? "min-h-[4.5rem] gap-1 px-3 py-2.5 sm:min-h-[4.75rem]"
            : "min-h-[5.25rem] gap-1.5 px-4 py-3 sm:min-h-[5.5rem]",
          disabled || isUploading
            ? "cursor-not-allowed border-muted/50 bg-muted/20 opacity-70"
            : isDragging
              ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
              : "border-primary/25 bg-muted/15 hover:border-primary/40 hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <UploadCloudIcon
          className={cn(
            "shrink-0 text-muted-foreground transition-[color,transform] duration-200 ease-out motion-reduce:transition-none",
            compact ? "size-6" : "size-7",
            isDragging && "scale-105 text-primary"
          )}
          aria-hidden
        />
        <div className="text-center">
          <p className="text-sm font-medium leading-snug text-foreground">
            {isDragging ? "Drop image or PDF here" : "Drag & drop national ID"}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:text-xs">
            or <span className="text-primary underline-offset-2 group-hover:underline">browse files</span> — images
            or PDF
          </p>
        </div>
      </div>

      {staged && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border border-primary/15 bg-card px-3 py-2.5",
            compact && "py-2"
          )}
        >
          <FileIcon className="size-4 shrink-0 text-primary/80" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{staged.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(staged.size)}</p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9 min-h-9 min-w-9 shrink-0"
            disabled={isUploading}
            onClick={(e) => {
              e.stopPropagation();
              clearStaged();
            }}
            aria-label="Remove selected file"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      )}

      {localError && (
        <p className="text-xs text-destructive" role="alert">
          {localError}
        </p>
      )}

      {mode === "upload" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 min-w-[44px] sm:min-h-9"
            disabled={disabled || isUploading || !staged}
            onClick={(e) => {
              e.stopPropagation();
              void handleUploadClick();
            }}
          >
            {isUploading ? "Uploading…" : "Upload document"}
          </Button>
          <span className="sr-only" id={`${inputId}-hint`}>
            Supported formats: images and PDF.
          </span>
        </div>
      )}

      {mode === "pick" && (
        <p className="text-xs text-muted-foreground" id={`${inputId}-hint`}>
          Optional. Included when you submit the form.
        </p>
      )}

      <label htmlFor={inputId} className="sr-only">
        National ID file
      </label>
    </div>
  );
}
