"use client"

import { useMemo } from "react"
import {
  ClipboardListIcon,
  NetworkIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
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
  const { data: currentUserData } = useCurrentUser()
  const t = useTranslations("nav.items")
  const tMeta = useTranslations("meta.brand")
  const tCommon = useTranslations("common.states")

  const navMain = useMemo(
    () => [
      {
        key: "community",
        title: t("community"),
        url: "/?section=shg",
        icon: <NetworkIcon />,
        defaultOpen: true,
        items: [
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
    ],
    [t]
  )

  const user = currentUserData?.user
  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : `${tCommon("loading")}`
  const displayEmail = user?.email ?? ""
  const displayRole = user?.role?.replace("ROLE_", "").replace(/_/g, " ") ?? ""

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href="/?section=shg"
          className="flex items-center gap-2 rounded-md border border-primary/10 bg-card px-3 py-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
        >
          <div className="relative size-7 overflow-hidden rounded-md border border-primary/10 bg-background">
            <Image
              src="/weemaNewLogo.png"
              alt={tMeta("name")}
              fill
              sizes="28px"
              className="object-contain p-1"
              priority
            />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold">{tMeta("name")}</p>
            <p className="text-xs text-muted-foreground">{tMeta("tagline")}</p>
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
