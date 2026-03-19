"use client"

import { useSearchParams } from "next/navigation"

import { SECTION_META } from "@/components/app-header"
import { CommunityStructurePanel } from "@/components/community-structure-panel"

export default function MainPage() {
  const searchParams = useSearchParams()
  const section = searchParams.get("section") ?? "region"
  const meta = SECTION_META[section] ?? SECTION_META.region

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
