"use client"

import { useMemo } from "react"
import {
  Building2Icon,
  ClipboardListIcon,
  MapPinnedIcon,
  NetworkIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useCurrentUser } from "@/hooks/use-user"

const baseNavMain = [
  {
    title: "Base Data",
    url: "/?section=region",
    icon: <MapPinnedIcon />,
    isActive: true,
    items: [
      { title: "Region",   url: "/?section=region" },
      { title: "Zone",     url: "/?section=zone" },
      { title: "Woreda",   url: "/?section=woreda" },
      { title: "Kebele",   url: "/?section=kebele" },
      { title: "Religion", url: "/?section=religion" },
    ],
  },
  {
    title: "Community Structure",
    url: "/?section=federation",
    icon: <NetworkIcon />,
    isActive: false,
    items: [
      { title: "Federations",      url: "/?section=federation" },
      { title: "Clusters",         url: "/?section=cluster" },
      { title: "Self-Help Groups", url: "/?section=shg" },
      { title: "Members", url: "/?section=member" },
    ],
  },
  {
    title: "Survey",
    url: "/survey",
    icon: <ClipboardListIcon />,
    isActive: false,
  },
  {
    title: "User Management",
    url: "/?section=users",
    icon: <UsersIcon />,
    isActive: false,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: currentUserData } = useCurrentUser()
  const navMain = useMemo(() => [...baseNavMain], [])

  const user = currentUserData?.user
  const displayName = user ? `${user.firstName} ${user.lastName}` : "Loading..."
  const displayEmail = user?.email ?? ""
  const displayRole = user?.role?.replace("ROLE_", "").replace(/_/g, " ") ?? ""

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href="/?section=region"
          className="flex items-center gap-2 rounded-md border border-primary/10 bg-card px-3 py-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
        >
          <div className="rounded-md bg-primary p-1.5 text-primary-foreground">
            <Building2Icon className="size-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold">WEEMA Admin</p>
            <p className="text-xs text-muted-foreground">Community Platform</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: displayName,
            email: displayEmail,
            role: displayRole,
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
