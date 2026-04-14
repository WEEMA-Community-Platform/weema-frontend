"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardListIcon,
  CircleCheckBigIcon,
  CopyIcon,
  LayersIcon,
  Link2Icon,
  SendHorizonalIcon,
  TextIcon,
  RefreshCcwDot,
} from "lucide-react";
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
  SurveyFiltersDialog,
  type SurveyAppliedFilters,
} from "@/components/survey/survey-filters-dialog";
import { SurveyAssignTargetsDialog } from "@/components/survey/survey-assign-targets-dialog";
import { SurveyCloneDialog } from "@/components/survey/survey-clone-dialog";
import {
  useDeleteSurveyMutation,
  usePublishSurveyMutation,
  useSurveysQuery,
} from "@/hooks/use-surveys";

const PAGE_SIZE = 10;

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedTargetType, setAppliedTargetType] = useState("");
  const [appliedActivity, setAppliedActivity] = useState("");
  const [pendingDeleteSurvey, setPendingDeleteSurvey] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [pendingPublishSurvey, setPendingPublishSurvey] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [cloneSurveyTarget, setCloneSurveyTarget] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);
  const [assignTargetsSurvey, setAssignTargetsSurvey] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [assignTargetsOpen, setAssignTargetsOpen] = useState(false);
  /** Defer clearing survey payload until after dialog exit animation (Dialog overlay/content use duration-150). */
  const assignTargetsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openAssignTargets = (payload: { id: string; title: string }) => {
    if (assignTargetsCloseTimerRef.current) {
      clearTimeout(assignTargetsCloseTimerRef.current);
      assignTargetsCloseTimerRef.current = null;
    }
    setAssignTargetsSurvey(payload);
    setAssignTargetsOpen(true);
  };

  const handleAssignTargetsOpenChange = (open: boolean) => {
    if (open) {
      setAssignTargetsOpen(true);
      return;
    }
    setAssignTargetsOpen(false);
    if (assignTargetsCloseTimerRef.current) clearTimeout(assignTargetsCloseTimerRef.current);
    assignTargetsCloseTimerRef.current = setTimeout(() => {
      assignTargetsCloseTimerRef.current = null;
      setAssignTargetsSurvey(null);
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (assignTargetsCloseTimerRef.current) {
        clearTimeout(assignTargetsCloseTimerRef.current);
      }
    };
  }, []);

  const isActiveFilter = useMemo(() => {
    if (appliedActivity === "ACTIVE") return true;
    if (appliedActivity === "INACTIVE") return false;
    return undefined;
  }, [appliedActivity]);

  const surveysQuery = useSurveysQuery({
    page,
    pageSize: PAGE_SIZE,
    searchQuery: searchQuery.trim() || undefined,
    status: appliedStatus || undefined,
    targetType: appliedTargetType || undefined,
    isActive: isActiveFilter,
  });
  const deleteMutation = useDeleteSurveyMutation();
  const publishMutation = usePublishSurveyMutation();
  const surveys = surveysQuery.data?.surveys ?? [];
  const hasActiveFilters = Boolean(appliedStatus || appliedTargetType || appliedActivity);
  const appliedFilters: SurveyAppliedFilters = useMemo(
    () => ({
      status: appliedStatus,
      targetType: appliedTargetType,
      activity: appliedActivity,
    }),
    [appliedStatus, appliedTargetType, appliedActivity]
  );

  const applySurveyFilters = (filters: SurveyAppliedFilters) => {
    setAppliedStatus(filters.status);
    setAppliedTargetType(filters.targetType);
    setAppliedActivity(filters.activity);
    setPage(1);
    setIsFilterOpen(false);
  };

  const hasSearch = Boolean(searchQuery.trim());
  const emptyMessage = listEmptyMessage({
    entityPlural: "surveys",
    hasSearch,
    hasFilters: hasActiveFilters,
    emptyCatalogHint: "No surveys yet. Add your first survey to get started.",
  });

  /** After delete, refetch and clamp page so we never sit past the last page or on an empty page. */
  const reconcilePageAfterDelete = async () => {
    const { data } = await surveysQuery.refetch();
    if (!data) return;
    const lastPage = Math.max(1, data.totalPages ?? 1);
    const current = page;
    let next = current;
    if (current > lastPage) next = lastPage;
    else if (data.surveys.length === 0 && data.totalElements > 0 && current > 1) next = 1;
    if (next !== current) setPage(next);
  };

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
        onOpenFilters={() => setIsFilterOpen(true)}
        showFilterButton
        hasActiveFilters={hasActiveFilters}
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
          {surveys.map((survey) => {
            const statusUpper = (survey.status ?? "").toUpperCase();
            /** Assignment uses the survey’s target type (MEMBER → SHGs, etc.); it is not tied to publish status. */
            const extraMenuItems = (
              <>
                {statusUpper === "DRAFT" ? (
                  <DropdownMenuItem
                    className="text-[12px] whitespace-nowrap"
                    onClick={() =>
                      setPendingPublishSurvey({
                        id: survey.id,
                        title: survey.title || "Untitled survey",
                      })
                    }
                  >
                    <SendHorizonalIcon className="size-4" />
                    Publish survey
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="text-[12px] whitespace-nowrap"
                  onClick={() =>
                    setCloneSurveyTarget({
                      id: survey.id,
                      title: survey.title || "Untitled survey",
                      description: survey.description ?? "",
                    })
                  }
                >
                  <CopyIcon className="size-4" />
                  Clone survey
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[12px] whitespace-nowrap"
                  onClick={() =>
                    openAssignTargets({
                      id: survey.id,
                      title: survey.title || "Untitled survey",
                    })
                  }
                >
                  <Link2Icon className="size-4" />
                  Assign targets
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[12px] whitespace-nowrap"
                  onClick={() =>
                    router.push(
                      `/survey/${survey.id}/submissions?surveyTitle=${encodeURIComponent(
                        survey.title || "Untitled survey"
                      )}&targetType=${encodeURIComponent(survey.targetType || "")}`
                    )
                  }
                >
                  <ClipboardListIcon className="size-4" />
                  View submission
                </DropdownMenuItem>
              </>
            );
            return (
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
              extraMenuItems={extraMenuItems}
            >
              <CardMetaRow icon={LayersIcon} label="Target">
                {survey.targetType || "-"}
              </CardMetaRow>
              <CardMetaRow icon={TextIcon} label="Questions">
                {survey.totalQuestions ?? 0} question{survey.totalQuestions === 1 ? "" : "s"}
              </CardMetaRow>

              <CardMetaRow icon={RefreshCcwDot} label="Version">
                {survey.version || "-"}
              </CardMetaRow>
              
              <CardMetaRow icon={CircleCheckBigIcon} label="Status">
                <SurveyStatusBadge status={survey.status} />
              </CardMetaRow>
            </CommunityCard>
            );
          })}
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

      <SurveyCloneDialog
        open={!!cloneSurveyTarget}
        onOpenChange={(open) => {
          if (!open) setCloneSurveyTarget(null);
        }}
        surveyId={cloneSurveyTarget?.id ?? null}
        originalTitle={cloneSurveyTarget?.title ?? ""}
        originalDescription={cloneSurveyTarget?.description ?? ""}
      />

      <SurveyFiltersDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        applied={appliedFilters}
        onApply={applySurveyFilters}
      />

      <SurveyAssignTargetsDialog
        open={assignTargetsOpen}
        onOpenChange={handleAssignTargetsOpenChange}
        surveyId={assignTargetsSurvey?.id ?? null}
        surveyTitle={assignTargetsSurvey?.title ?? ""}
      />

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
                  await reconcilePageAfterDelete();
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
