import { SECTION_META } from "@/components/section-meta"
import { CommunityStructurePanel } from "@/components/community-structure-panel"
import { redirect } from "next/navigation"

type MainPageProps = {
  searchParams?: Promise<{
    section?: string | string[]
  }>
}

export default async function MainPage({ searchParams }: MainPageProps) {
  const resolvedSearchParams = await searchParams
  const rawSection = resolvedSearchParams?.section
  const section = Array.isArray(rawSection) ? rawSection[0] : rawSection
  if (!section || !SECTION_META[section]) {
    redirect("/?section=shg")
  }
  const meta = SECTION_META[section] ?? SECTION_META.shg

  return (
    <>
      <div className="rounded-xl border border-primary/15 bg-card px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">{meta.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
      </div>
      <CommunityStructurePanel />
    </>
  )
}
