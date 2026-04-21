"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export type NavSubItem = {
  key: string
  title: string
  url: string
}

export type NavItem = {
  key: string
  title: string
  url: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  items?: NavSubItem[]
}

const OPEN_GROUPS_STORAGE_KEY = "weema-facilitator:nav-open-groups"

function readStoredOpenGroups(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.sessionStorage.getItem(OPEN_GROUPS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeStoredOpenGroups(next: Record<string, boolean>) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(OPEN_GROUPS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Silently ignore storage failures (e.g., disabled sessionStorage).
  }
}

export function NavMain({ items }: { items: NavItem[] }) {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSection = searchParams.get("section")
  const { state } = useSidebar()

  const isLinkActive = useCallback(
    (url: string) => {
      if (url.startsWith("/?section=")) {
        return (
          pathname === "/" &&
          !!activeSection &&
          url.includes(`section=${activeSection}`)
        )
      }
      return pathname === url || pathname.startsWith(`${url}/`)
    },
    [pathname, activeSection]
  )

  // User's explicit open/close preferences, persisted across navigations
  // and language switches via sessionStorage. Keyed by stable group keys
  // so translations never invalidate the state.
  const [userToggles, setUserToggles] = useState<Record<string, boolean>>(
    readStoredOpenGroups
  )

  // Effective open state: any group containing the active link is always
  // open; otherwise fall back to the user's stored preference, finally
  // defaultOpen.
  const openGroups = useMemo(() => {
    const result: Record<string, boolean> = {}
    for (const item of items) {
      if (!item.items?.length) continue
      const hasActiveChild = item.items.some((sub) => isLinkActive(sub.url))
      if (hasActiveChild) {
        result[item.key] = true
      } else if (item.key in userToggles) {
        result[item.key] = userToggles[item.key]
      } else {
        result[item.key] = item.defaultOpen ?? false
      }
    }
    return result
  }, [items, userToggles, isLinkActive])

  const toggleGroup = useCallback(
    (key: string) => {
      setUserToggles((prev) => {
        const currentlyOpen = openGroups[key] ?? false
        const next = { ...prev, [key]: !currentlyOpen }
        writeStoredOpenGroups(next)
        return next
      })
    },
    [openGroups]
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("groupLabel")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const itemActive =
            isLinkActive(item.url) ||
            !!item.items?.some((sub) => isLinkActive(sub.url))

          if (state === "collapsed" || !item.items?.length) {
            return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={itemActive}
                  render={<Link href={item.url} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.key}
              open={openGroups[item.key] ?? false}
              onOpenChange={() => toggleGroup(item.key)}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} isActive={itemActive} />}
              >
                {item.icon}
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.key}>
                      <SidebarMenuSubButton
                        isActive={isLinkActive(subItem.url)}
                        render={<Link href={subItem.url} />}
                      >
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
