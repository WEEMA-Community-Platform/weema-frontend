import { SurveySubmissionsPage } from "@/components/survey/survey-submissions-page";

type PageProps = {
  params: Promise<{ surveyId: string }>;
  searchParams: Promise<{ targetType?: string }>;
};

export default async function SurveySubmissionsRoute({ params, searchParams }: PageProps) {
  const { surveyId } = await params;
  const { targetType } = await searchParams;
  return <SurveySubmissionsPage surveyId={surveyId} initialTargetType={targetType} />;
}
