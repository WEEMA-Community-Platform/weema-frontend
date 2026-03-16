"use client"

import { useLogoutMutation } from "@weema/auth/react-query"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Building2Icon, LogOutIcon, MapPinnedIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"

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
  const router = useRouter()
  const logoutMutation = useLogoutMutation({ baseUrl: "/api/auth" })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md border border-primary/10 bg-card px-3 py-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
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
      <SidebarFooter>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          disabled={logoutMutation.isPending}
          onClick={async () => {
            try {
              const result = await logoutMutation.mutateAsync()
              sileo.success({
                title: "Logged out",
                description: result.message || "You have been signed out.",
              })
              router.push("/login")
              router.refresh()
            } catch (error) {
              sileo.error({
                title: "Logout failed",
                description:
                  error instanceof Error ? error.message : "Unexpected error",
              })
            }
          }}
        >
          <LogOutIcon className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
