import { SurveyBuilderPage } from "@/components/survey/survey-builder-page";

type BuilderPageProps = {
  searchParams?: Promise<{
    id?: string | string[];
    translateFrom?: string | string[];
    translateLanguage?: string | string[];
  }>;
};

export default async function SurveyBuilderStandalonePage({ searchParams }: BuilderPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawSurveyId = resolvedSearchParams?.id;
  const surveyId = Array.isArray(rawSurveyId) ? rawSurveyId[0] : rawSurveyId;
  const rawTranslateFrom = resolvedSearchParams?.translateFrom;
  const translateFrom = Array.isArray(rawTranslateFrom)
    ? rawTranslateFrom[0]
    : rawTranslateFrom;
  const rawTranslateLanguage = resolvedSearchParams?.translateLanguage;
  const translateLanguageValue = Array.isArray(rawTranslateLanguage)
    ? rawTranslateLanguage[0]
    : rawTranslateLanguage;
  const translateLanguage = translateLanguageValue === "am" ? "am" : translateLanguageValue === "en" ? "en" : undefined;

  return (
    <SurveyBuilderPage
      initialSurveyId={surveyId}
      translationSourceSurveyId={translateFrom}
      translationLanguage={translateLanguage}
    />
  );
}
