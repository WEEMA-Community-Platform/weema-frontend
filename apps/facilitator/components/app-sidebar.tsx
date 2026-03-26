"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-user";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/community/shgs", label: "SHGs" },
  { href: "/community/members", label: "Members" },
  { href: "/surveys/assignments", label: "Assigned Surveys" },
  { href: "/surveys/submissions", label: "Submissions" },
  { href: "/profile", label: "Profile" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data } = useCurrentUser();
  const user = data?.user;

  return (
    <aside className="w-64 shrink-0 border-r border-black/10 bg-white/60 p-4">
      <div className="mb-5 rounded-lg border border-black/10 p-3">
        <p className="text-sm font-semibold">WEEMA Facilitator</p>
        <p className="text-xs text-black/60">Field Operations</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm ${active ? "bg-orange-100 text-orange-900" : "hover:bg-black/5"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-lg border border-black/10 p-3">
        <p className="text-sm font-medium">{user ? `${user.firstName} ${user.lastName}` : "..."}</p>
        <p className="text-xs text-black/60">{user?.email ?? "Loading user..."}</p>
      </div>
    </aside>
  );
}
