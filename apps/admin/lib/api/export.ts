import type { BaseApiResponse } from "@/lib/api/base-data";

export class EmailExportRequiredError extends Error {
  constructor(
    readonly rowCount: number,
    message: string
  ) {
    super(message);
    this.name = "EmailExportRequiredError";
  }
}

export function throwIfEmailExportRequired(response: Response, payload: unknown): void {
  if (response.status !== 422 || !payload || typeof payload !== "object") return;
  const error = payload as Record<string, unknown>;
  if (error.requiredExportMode !== "email" || typeof error.rowCount !== "number") return;
  throw new EmailExportRequiredError(
    error.rowCount,
    typeof error.message === "string" ? error.message : "Export by email is required."
  );
}

export type EmailExportAcceptedResponse = BaseApiResponse & {
  rowCount: number;
  exportMode: "email";
};

/** Reuse the authenticated same-origin export proxy, preserving any existing filters. */
export async function requestEmailExport(path: string): Promise<EmailExportAcceptedResponse> {
  if (!path.startsWith("/api/export/")) {
    throw new Error("Invalid export path");
  }
  const url = new URL(path, "http://localhost");
  url.searchParams.set("exportMode", "email");
  const response = await fetch(`${url.pathname}${url.search}`, {
    cache: "no-store",
    credentials: "include",
  });
  const payload = (await response.json().catch(() => null)) as
    | (Partial<EmailExportAcceptedResponse> & { message?: string })
    | null;

  if (response.status !== 202 || payload?.exportMode !== "email") {
    throw new Error(payload?.message ?? "Could not request the email export.");
  }

  return payload as EmailExportAcceptedResponse;
}
