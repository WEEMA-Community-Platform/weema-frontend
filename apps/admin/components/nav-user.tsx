"use client"

import { useLogoutMutation } from "@weema/auth/react-query"
import { LogOutIcon, ChevronsUpDownIcon, UserCircle2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { sileo } from "sileo"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    role: string
    avatar: string
  }
}) {
  const t = useTranslations("nav.user")
  const tCommon = useTranslations("common.validation")
  const { isMobile } = useSidebar()
  const router = useRouter()
  const logoutMutation = useLogoutMutation({ baseUrl: "/api/auth" })

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const handleLogout = async () => {
    try {
      const result = await logoutMutation.mutateAsync()
      sileo.success({
        title: t("loggedOut"),
        description: result.message || t("loggedOutMessage"),
      })
      router.push("/login")
      router.refresh()
    } catch (error) {
      sileo.error({
        title: t("logoutFailed"),
        description: error instanceof Error ? error.message : tCommon("unexpectedError"),
      })
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-64 rounded-xl border border-border/60 bg-popover p-1.5 shadow-lg shadow-black/5 ring-1 ring-black/5 dark:ring-white/10"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="cursor-default rounded-lg bg-muted/30 p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar className="size-9 ring-1 ring-border/60">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {initials || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    {user.role && (
                      <span className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                        {user.role.replace(/^ROLE_/, "").replace(/_/g, " ").toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1.5 bg-border/80" />
            <DropdownMenuGroup className="gap-0.5">
              <DropdownMenuItem onClick={() => router.push("/?section=profile")}>
                <UserCircle2Icon className="size-4 opacity-80" />
                {t("profile")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={logoutMutation.isPending}
                onClick={handleLogout}
              >
                <LogOutIcon className="size-4 opacity-90" />
                {logoutMutation.isPending ? t("loggingOut") : t("logout")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
