import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"

import { SECTION_META_KEYS } from "@/components/section-meta"
import { CommunityStructurePanel } from "@/components/community-structure-panel"

type MainPageProps = {
  searchParams?: Promise<{
    section?: string | string[]
  }>
}

export default async function MainPage({ searchParams }: MainPageProps) {
  const resolvedSearchParams = await searchParams
  const rawSection = resolvedSearchParams?.section
  const section = Array.isArray(rawSection) ? rawSection[0] : rawSection
  if (!section || !SECTION_META_KEYS[section]) {
    redirect("/?section=region")
  }
  const metaKeys = SECTION_META_KEYS[section] ?? SECTION_META_KEYS.region
  const t = await getTranslations()

  return (
    <>
      <div className="rounded-xl border border-primary/15 bg-card px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">{t(metaKeys.labelKey)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(metaKeys.descriptionKey)}</p>
      </div>
      <CommunityStructurePanel />
    </>
  )
}
