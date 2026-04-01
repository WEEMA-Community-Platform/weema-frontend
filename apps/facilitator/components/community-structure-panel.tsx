"use client";

import { useSearchParams } from "next/navigation";

import { SHGManager } from "@/components/community/shg-manager";
import { MemberManager } from "@/components/community/members/member-manager";
import { ProfilePanel } from "@/components/users/profile-panel";

type SectionKey = "shg" | "member" | "profile";

export function CommunityStructurePanel() {
  const searchParams = useSearchParams();
  const section = (searchParams.get("section") ?? "shg") as SectionKey;

  if (section === "profile") return <ProfilePanel />;
  if (section === "member") return <MemberManager />;
  return <SHGManager />;
}
