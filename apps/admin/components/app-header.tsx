"use client"

import { useSearchParams } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export const SECTION_META: Record<
  string,
  { group: string; label: string; description: string }
> = {
  region:     { group: "Base Data",           label: "Regions",          description: "Manage administrative regions." },
  zone:       { group: "Base Data",           label: "Zones",            description: "Manage zones within regions." },
  woreda:     { group: "Base Data",           label: "Woredas",          description: "Manage woredas within zones." },
  kebele:     { group: "Base Data",           label: "Kebeles",          description: "Manage kebeles within woredas." },
  religion:   { group: "Base Data",           label: "Religions",        description: "Manage reference religion data." },
  federation: { group: "Community Structure", label: "Federations",      description: "Manage federations that group clusters together." },
  cluster:    { group: "Community Structure", label: "Clusters",         description: "Manage clusters linked to woredas and federations." },
  shg:        { group: "Community Structure", label: "Self-Help Groups", description: "Manage self-help groups and their cluster assignments." },
  member:     { group: "Community Structure", label: "Members", description: "Register and manage members within self-help groups." },
}

export function AppHeader() {
  const searchParams = useSearchParams()
  const section = searchParams.get("section") ?? "region"
  const meta = SECTION_META[section] ?? SECTION_META.region

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-primary/10 bg-background/80 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <span className="text-muted-foreground">{meta.group}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{meta.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
