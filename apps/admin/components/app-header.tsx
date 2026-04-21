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
import { PATH_META_KEYS, SECTION_META_KEYS } from "@/components/section-meta"

export function AppHeader() {
  const t = useTranslations()
  const tSections = useTranslations("sections")
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const section = searchParams.get("section") ?? "region"
  const surveyTitle = searchParams.get("surveyTitle")
  const isSurveySubmissionsPath =
    pathname.startsWith("/survey/") && pathname.endsWith("/submissions")
  const inAnswerWorkspace = searchParams.get("view") === "answers"
  const targetName = searchParams.get("targetName") ?? searchParams.get("memberName")

  const metaKeys = isSurveySubmissionsPath
    ? PATH_META_KEYS["/survey/submissions"]
    : PATH_META_KEYS[pathname] ?? SECTION_META_KEYS[section] ?? SECTION_META_KEYS.region

  const group = t(metaKeys.groupKey)
  const baseLabel = t(metaKeys.labelKey)
  const label =
    isSurveySubmissionsPath && surveyTitle ? `${baseLabel} - ${surveyTitle}` : baseLabel

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
                  <BreadcrumbPage>
                    {targetName
                      ? tSections("surveySubmissions.targetAnswers", { name: targetName })
                      : tSections("surveySubmissions.answerWorkspace")}
                  </BreadcrumbPage>
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
