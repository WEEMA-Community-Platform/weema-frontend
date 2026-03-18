import { AppSidebar } from "@/components/app-sidebar"
import { CommunityStructurePanel } from "@/components/community-structure-panel"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export const dynamic = "force-dynamic"

const SECTION_META: Record<
  string,
  { group: string; label: string; description: string }
> = {
  region:     { group: "Base Data",            label: "Regions",          description: "Manage administrative regions." },
  zone:       { group: "Base Data",            label: "Zones",            description: "Manage zones within regions." },
  woreda:     { group: "Base Data",            label: "Woredas",          description: "Manage woredas within zones." },
  kebele:     { group: "Base Data",            label: "Kebeles",          description: "Manage kebeles within woredas." },
  religion:   { group: "Base Data",            label: "Religions",        description: "Manage reference religion data." },
  federation: { group: "Community Structure",  label: "Federations",      description: "Manage federations that group clusters together." },
  cluster:    { group: "Community Structure",  label: "Clusters",         description: "Manage clusters linked to woredas and federations." },
  shg:        { group: "Community Structure",  label: "Self-Help Groups", description: "Manage self-help groups and their cluster assignments." },
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const section = params.section ?? "region"
  const meta = SECTION_META[section] ?? SECTION_META.region

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 md:p-6">
          <div className="rounded-xl border border-primary/15 bg-card px-4 py-3">
            <h1 className="text-lg font-semibold tracking-tight">{meta.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
          </div>
          <CommunityStructurePanel />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
