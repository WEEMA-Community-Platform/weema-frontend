"use client"

import { useMemo } from "react"
import {
  Building2Icon,
  ClipboardListIcon,
  NetworkIcon,
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
    title: "Community",
    url: "/?section=shg",
    icon: <NetworkIcon />,
    isActive: true,
    items: [
      { title: "Self-Help Groups", url: "/?section=shg" },
      { title: "Members",          url: "/?section=member" },
    ],
  },
  {
    title: "Survey",
    url: "/survey",
    icon: <ClipboardListIcon />,
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
          href="/?section=shg"
          className="flex items-center gap-2 rounded-md border border-primary/10 bg-card px-3 py-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
        >
          <div className="rounded-md bg-primary p-1.5 text-primary-foreground">
            <Building2Icon className="size-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold">WEEMA Facilitator</p>
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
