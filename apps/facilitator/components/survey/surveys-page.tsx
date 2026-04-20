"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleCheckBigIcon,
  LayersIcon,
  RefreshCcwDot,
  TextIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CardMetaRow,
  CommunityCard,
  CommunityCardSkeleton,
} from "@/components/community/community-card";
import {
  DataToolbar,
  PaginationRow,
  useListEmptyMessage,
} from "@/components/base-data/shared";
import {
  SurveyFiltersDialog,
  type SurveyAppliedFilters,
} from "@/components/survey/survey-filters-dialog";
import { useSurveysQuery } from "@/hooks/use-surveys";

const PAGE_SIZE = 10;

function SurveyStatusBadge({ status }: { status?: string }) {
  const tBadge = useTranslations("survey.list.statusBadge");
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "PUBLISHED") {
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        {tBadge("published")}
      </Badge>
    );
  }

  if (normalized === "DRAFT") {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        {tBadge("draft")}
      </Badge>
    );
  }

  return <Badge variant="outline">{status || "-"}</Badge>;
}

export function SurveysPage() {
  const router = useRouter();
  const tList = useTranslations("survey.list");
  const tCard = useTranslations("survey.list.card");
  const tActions = useTranslations("common.actions");
  const tEntity = useTranslations("listEmpty.entity");
  const listEmptyMessage = useListEmptyMessage();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedTargetType, setAppliedTargetType] = useState("");
  const [appliedActivity, setAppliedActivity] = useState("");

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

  const surveys = surveysQuery.data?.surveys ?? [];
  const hasActiveFilters = Boolean(
    appliedStatus || appliedTargetType || appliedActivity
  );
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
    entityPlural: tEntity("surveys"),
    hasSearch,
    hasFilters: hasActiveFilters,
    emptyCatalogHint: tList("emptyHint"),
  });

  return (
    <div className="space-y-4">
      <DataToolbar
        searchPlaceholder={tList("searchPlaceholder")}
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
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
              : tList("loadError")}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => surveysQuery.refetch()}
          >
            {tActions("retry")}
          </Button>
        </div>
      ) : surveys.length === 0 ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {surveys.map((survey) => {
            const questions = survey.totalQuestions ?? 0;
            return (
              <CommunityCard
                key={survey.id}
                title={survey.title || tList("untitled")}
                status={survey.isActive ? "ACTIVE" : "INACTIVE"}
                onView={() =>
                  router.push(
                    `/survey/${survey.id}/submissions?surveyTitle=${encodeURIComponent(
                      survey.title || tList("untitled")
                    )}&targetType=${encodeURIComponent(survey.targetType || "")}`
                  )
                }
                showEditAction={false}
                showDeleteAction={false}
                viewActionLabel={tList("manageSubmissions")}
              >
                <CardMetaRow icon={LayersIcon} label={tCard("target")}>
                  {survey.targetType || "-"}
                </CardMetaRow>
                <CardMetaRow icon={TextIcon} label={tCard("questions")}>
                  {questions === 1
                    ? tCard("questionsOne", { count: questions })
                    : tCard("questionsOther", { count: questions })}
                </CardMetaRow>
                <CardMetaRow icon={RefreshCcwDot} label={tCard("version")}>
                  {survey.version || "-"}
                </CardMetaRow>
                <CardMetaRow icon={CircleCheckBigIcon} label={tCard("status")}>
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

      <SurveyFiltersDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        applied={appliedFilters}
        onApply={applySurveyFilters}
      />
    </div>
  );
}
