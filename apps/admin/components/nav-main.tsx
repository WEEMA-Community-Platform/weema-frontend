"use client"

import { useState } from "react"
import Link from "next/link"
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

type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  items?: { title: string; url: string }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSection = searchParams.get("section")
  const { state } = useSidebar()

  const isLinkActive = (url: string) => {
    if (url.startsWith("/?section=")) {
      return pathname === "/" && !!activeSection && url.includes(`section=${activeSection}`)
    }

    return pathname === url || pathname.startsWith(`${url}/`)
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      items.map((item) => [
        item.title,
        item.items?.some((sub) => {
          return isLinkActive(sub.url)
        }) ?? item.isActive ?? false,
      ])
    )
  )

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          state === "collapsed" ? (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isLinkActive(item.url)}
                render={<Link href={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : !item.items?.length ? (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isLinkActive(item.url)}
                render={<Link href={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <Collapsible
              key={item.title}
              open={openGroups[item.title] ?? false}
              onOpenChange={() => toggleGroup(item.title)}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} />}
              >
                {item.icon}
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
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
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
