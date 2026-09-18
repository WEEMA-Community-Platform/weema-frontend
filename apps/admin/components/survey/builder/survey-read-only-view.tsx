"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveyBuilderState } from "@/lib/survey-builder/types";

export function SurveyReadOnlyView({ survey }: { survey: SurveyBuilderState }) {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <Card className="border-primary/10">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{survey.title || "Untitled survey"}</CardTitle>
            <Badge variant="outline">Read only</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <ReadOnlyField label="Description" value={survey.description} />
          <ReadOnlyField label="Target type" value={survey.targetType} />
          <ReadOnlyField
            label="Language"
            value={survey.language === "am" ? "Amharic" : "English"}
          />
          <ReadOnlyField label="Sections" value={String(survey.sections.length)} />
        </CardContent>
      </Card>

      {survey.sections.map((section, sectionIndex) => (
        <Card key={section.clientId} className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">
              {sectionIndex + 1}. {section.title || "Untitled section"}
            </CardTitle>
            {section.description ? (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {section.questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No questions in this section.</p>
            ) : (
              section.questions.map((question, questionIndex) => (
                <div
                  key={question.clientId}
                  className="rounded-lg border border-primary/10 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">
                      {questionIndex + 1}. {question.questionText || "Untitled question"}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{question.questionType.replaceAll("_", " ")}</Badge>
                      {question.required ? <Badge variant="outline">Required</Badge> : null}
                    </div>
                  </div>
                  {question.options.length > 0 ? (
                    <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                      {question.options.map((option) => (
                        <li key={option.clientId}>{option.text || "Untitled option"}</li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap">{value || "—"}</p>
    </div>
  );
}
