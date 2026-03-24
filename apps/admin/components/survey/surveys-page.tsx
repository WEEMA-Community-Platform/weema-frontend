"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheckBigIcon, LayersIcon, TextIcon } from "lucide-react";
import { sileo } from "sileo";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
import {
  CardMetaRow,
  CommunityCard,
  CommunityCardSkeleton,
} from "@/components/community/community-card";
import {
  DataToolbar,
  PaginationRow,
  listEmptyMessage,
} from "@/components/base-data/shared";
import {
  useDeleteSurveyMutation,
  usePublishSurveyMutation,
  useSurveysQuery,
} from "@/hooks/use-surveys";

const PAGE_SIZE = 20;

function SurveyStatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "PUBLISHED") {
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        Published
      </Badge>
    );
  }

  if (normalized === "DRAFT") {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        Draft
      </Badge>
    );
  }

  return <Badge variant="outline">{status || "-"}</Badge>;
}

export function SurveysPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteSurvey, setPendingDeleteSurvey] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [pendingPublishSurvey, setPendingPublishSurvey] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const surveysQuery = useSurveysQuery({
    page,
    pageSize: PAGE_SIZE,
    searchQuery: searchQuery.trim() || undefined,
  });
  const deleteMutation = useDeleteSurveyMutation();
  const publishMutation = usePublishSurveyMutation();
  const surveys = surveysQuery.data?.surveys ?? [];
  const hasSearch = Boolean(searchQuery.trim());
  const emptyMessage = listEmptyMessage({
    entityPlural: "surveys",
    hasSearch,
    hasFilters: false,
    emptyCatalogHint: "No surveys yet. Add your first survey to get started.",
  });

  return (
    <div className="space-y-4">
      <DataToolbar
        searchPlaceholder="Search surveys"
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        onAdd={() => router.push("/survey/builder")}
        addLabel="Add Survey"
      />

      {surveysQuery.isLoading ? (
        <CommunityCardSkeleton rowCount={3} />
      ) : surveysQuery.isError ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {surveysQuery.error instanceof Error
              ? surveysQuery.error.message
              : "Failed to load surveys."}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => surveysQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : surveys.length === 0 ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {surveys.map((survey) => (
            <CommunityCard
              key={survey.id}
              title={survey.title || "Untitled survey"}
              status={survey.isActive ? "ACTIVE" : "INACTIVE"}
              onView={() => router.push(`/survey/builder?id=${survey.id}`)}
              onEdit={() => router.push(`/survey/builder?id=${survey.id}`)}
              onDelete={() =>
                setPendingDeleteSurvey({
                  id: survey.id,
                  title: survey.title || "Untitled survey",
                })
              }
              showEditAction={false}
              viewActionLabel="Open survey"
              extraMenuItems={
                (survey.status ?? "").toUpperCase() === "DRAFT" ? (
                  <DropdownMenuItem
                    onClick={() =>
                      setPendingPublishSurvey({
                        id: survey.id,
                        title: survey.title || "Untitled survey",
                      })
                    }
                  >
                    Publish survey
                  </DropdownMenuItem>
                ) : null
              }
            >
              <CardMetaRow icon={LayersIcon} label="Target">
                {survey.targetType || "-"}
              </CardMetaRow>
              <CardMetaRow icon={TextIcon} label="Questions">
                {survey.totalQuestions ?? 0} question{survey.totalQuestions === 1 ? "" : "s"}
              </CardMetaRow>
              <CardMetaRow icon={CircleCheckBigIcon} label="Status">
                <SurveyStatusBadge status={survey.status} />
              </CardMetaRow>
            </CommunityCard>
          ))}
        </div>
      )}

      {surveysQuery.data && surveysQuery.data.totalPages > 1 ? (
        <PaginationRow
          currentPage={surveysQuery.data.currentPage}
          totalPages={surveysQuery.data.totalPages}
          totalElements={surveysQuery.data.totalElements}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() =>
            setPage((prev) =>
              Math.min(surveysQuery.data?.totalPages ?? prev, prev + 1)
            )
          }
        />
      ) : null}

      <AlertDialog
        open={!!pendingDeleteSurvey}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteSurvey(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete survey</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDeleteSurvey?.title}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={async () => {
                if (!pendingDeleteSurvey) return;
                try {
                  const result = await deleteMutation.mutateAsync(pendingDeleteSurvey.id);
                  sileo.success({
                    title: "Survey deleted",
                    description: result.message || "Survey has been removed.",
                  });
                  setPendingDeleteSurvey(null);
                } catch (error) {
                  sileo.error({
                    title: "Failed to delete survey",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete survey"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingPublishSurvey}
        onOpenChange={(open) => {
          if (!open) setPendingPublishSurvey(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish survey</AlertDialogTitle>
            <AlertDialogDescription>
              Publish{" "}
              <span className="font-semibold text-foreground">
                {pendingPublishSurvey?.title}
              </span>
              ? Published surveys should be treated as live and stable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={publishMutation.isPending}
              onClick={async () => {
                if (!pendingPublishSurvey) return;
                try {
                  const result = await publishMutation.mutateAsync(
                    pendingPublishSurvey.id
                  );
                  sileo.success({
                    title: "Survey published",
                    description: result.message || "Survey is now published.",
                  });
                  setPendingPublishSurvey(null);
                } catch (error) {
                  sileo.error({
                    title: "Failed to publish survey",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              {publishMutation.isPending ? "Publishing..." : "Publish survey"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
