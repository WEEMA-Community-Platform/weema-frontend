"use client"

import { useTranslations } from "next-intl"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LanguageSwitcherButton } from "@/components/language-switcher"
import {
  PATH_META_KEYS,
  SECTION_META_KEYS,
} from "@/components/section-meta"

export function AppHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const section = searchParams.get("section") ?? "shg"
  const surveyTitle = searchParams.get("surveyTitle")
  const isSurveySubmissionsPath =
    pathname.startsWith("/survey/") && pathname.endsWith("/submissions")
  const inAnswerWorkspace = searchParams.get("view") === "answers"
  const targetName =
    searchParams.get("targetName") ?? searchParams.get("memberName")

  const t = useTranslations()
  const tSubs = useTranslations("sections.surveySubmissions")

  const metaKey =
    (isSurveySubmissionsPath
      ? PATH_META_KEYS["/survey/submissions"]
      : PATH_META_KEYS[pathname] ?? SECTION_META_KEYS[section]) ??
    SECTION_META_KEYS.shg

  const group = t(`${metaKey}.group`)
  const baseLabel = t(`${metaKey}.label`)
  const label =
    isSurveySubmissionsPath && surveyTitle
      ? `${baseLabel} - ${surveyTitle}`
      : baseLabel

  const answersLabel = targetName
    ? tSubs("targetAnswers", { name: targetName })
    : tSubs("answerWorkspace")

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-primary/10 bg-background/80 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <span className="text-muted-foreground">{group}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
            {isSurveySubmissionsPath && inAnswerWorkspace ? (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>{answersLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2 px-4">
        <LanguageSwitcherButton />
      </div>
    </header>
  )
}
