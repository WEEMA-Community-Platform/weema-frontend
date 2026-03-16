"use client"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Building2Icon, MapPinnedIcon } from "lucide-react"
import Link from "next/link"

const data = {
  navMain: [
    {
      title: "Base Data",
      url: "/?section=region",
      icon: <MapPinnedIcon />,
      isActive: true,
      items: [
        {
          title: "Region",
          url: "/?section=region",
        },
        {
          title: "Zone",
          url: "/?section=zone",
        },
        {
          title: "Woreda",
          url: "/?section=woreda",
        },
        {
          title: "Kebele",
          url: "/?section=kebele",
        },
        {
          title: "Religion",
          url: "/?section=religion",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md border border-primary/10 bg-card px-3 py-2"
        >
          <div className="rounded-md bg-[#415A9F] p-1.5 text-white">
            <Building2Icon className="size-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold">WEEMA Admin</p>
            <p className="text-xs text-muted-foreground">Community Platform</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
