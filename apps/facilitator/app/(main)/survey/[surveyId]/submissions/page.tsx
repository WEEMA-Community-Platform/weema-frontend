import { SurveySubmissionsPage } from "@/components/survey/survey-submissions-page";
import { resolveSurveyTargetTypeForSubmissionsPage } from "@/lib/server/resolve-survey-target-type";

type PageProps = {
  params: Promise<{ surveyId: string }>;
  searchParams: Promise<{ targetType?: string }>;
};

export default async function SurveySubmissionsRoute({ params, searchParams }: PageProps) {
  const { surveyId } = await params;
  const { targetType } = await searchParams;
  const surveyTargetType = await resolveSurveyTargetTypeForSubmissionsPage(surveyId, targetType);
  return <SurveySubmissionsPage surveyId={surveyId} surveyTargetType={surveyTargetType} />;
}
