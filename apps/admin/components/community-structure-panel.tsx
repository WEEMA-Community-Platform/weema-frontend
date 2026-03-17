"use client";

import { useSearchParams } from "next/navigation";

import { KebeleManager } from "@/components/base-data/kebele-manager";
import { RegionManager } from "@/components/base-data/region-manager";
import { ReligionManager } from "@/components/base-data/religion-manager";
import { WoredaManager } from "@/components/base-data/woreda-manager";
import { ZoneManager } from "@/components/base-data/zone-manager";

type SectionKey = "region" | "zone" | "woreda" | "kebele" | "religion";

export function CommunityStructurePanel() {
  const searchParams = useSearchParams();
  const section = (searchParams.get("section") ?? "region") as SectionKey;

  if (section === "region") return <RegionManager />;
  if (section === "zone") return <ZoneManager />;
  if (section === "woreda") return <WoredaManager />;
  if (section === "kebele") return <KebeleManager />;
  if (section === "religion") return <ReligionManager />;
  return <RegionManager />;
}

