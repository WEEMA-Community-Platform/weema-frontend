"use client"

import { useMemo } from "react"
import {
  Building2Icon,
  ClipboardListIcon,
  MapPinnedIcon,
  NetworkIcon,
  UsersIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("nav.items")
  const tBrand = useTranslations("meta.brand")
  const tStates = useTranslations("common.states")
  const { data: currentUserData } = useCurrentUser()

  const navMain = useMemo(
    () => [
      {
        key: "baseData",
        title: t("baseData"),
        url: "/?section=region",
        icon: <MapPinnedIcon />,
        defaultOpen: true,
        items: [
          { key: "region", title: t("region"), url: "/?section=region" },
          { key: "zone", title: t("zone"), url: "/?section=zone" },
          { key: "woreda", title: t("woreda"), url: "/?section=woreda" },
          { key: "kebele", title: t("kebele"), url: "/?section=kebele" },
          { key: "religion", title: t("religion"), url: "/?section=religion" },
        ],
      },
      {
        key: "communityStructure",
        title: t("communityStructure"),
        url: "/?section=federation",
        icon: <NetworkIcon />,
        items: [
          { key: "federation", title: t("federations"), url: "/?section=federation" },
          { key: "cluster", title: t("clusters"), url: "/?section=cluster" },
          { key: "shg", title: t("shg"), url: "/?section=shg" },
          { key: "member", title: t("members"), url: "/?section=member" },
        ],
      },
      {
        key: "survey",
        title: t("survey"),
        url: "/survey",
        icon: <ClipboardListIcon />,
      },
      {
        key: "userManagement",
        title: t("userManagement"),
        url: "/?section=users",
        icon: <UsersIcon />,
      },
    ],
    [t]
  )

  const user = currentUserData?.user
  const displayName = user ? `${user.firstName} ${user.lastName}` : tStates("loading")
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
            <p className="text-sm font-semibold">{tBrand("name")}</p>
            <p className="text-xs text-muted-foreground">{tBrand("tagline")}</p>
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
