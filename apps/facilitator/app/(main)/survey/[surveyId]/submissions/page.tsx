import { SurveySubmissionsPage } from "@/components/survey/survey-submissions-page";

type PageProps = {
  params: Promise<{ surveyId: string }>;
};

export default async function SurveySubmissionsRoute({ params }: PageProps) {
  const { surveyId } = await params;
  return <SurveySubmissionsPage surveyId={surveyId} />;
}
