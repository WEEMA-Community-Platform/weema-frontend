import { SurveyBuilderPage } from "@/components/survey/survey-builder-page";

type BuilderPageProps = {
  searchParams?: Promise<{
    id?: string | string[];
  }>;
};

export default async function SurveyBuilderStandalonePage({ searchParams }: BuilderPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawSurveyId = resolvedSearchParams?.id;
  const surveyId = Array.isArray(rawSurveyId) ? rawSurveyId[0] : rawSurveyId;

  return <SurveyBuilderPage initialSurveyId={surveyId} />;
}
