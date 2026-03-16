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

export default function AdminHomePage() {
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
                  <span className="text-muted-foreground">Dashboard</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Base Data</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 md:p-6">
          <div className="rounded-xl border border-primary/15 bg-card px-4 py-3">
            <h1 className="text-lg font-semibold tracking-tight">
              Base Data Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage Region, Zone, Woreda, Kebele, and Religion from one
              consistent workspace.
            </p>
          </div>
          <CommunityStructurePanel />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
