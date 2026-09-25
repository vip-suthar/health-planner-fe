import { Compass, Home, LineChart, User, type LucideIcon } from "lucide-react";

export type TabKey = "today" | "progress" | "explore" | "profile";

export interface TabItem {
  key: TabKey;
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Four bottom tabs, in order. Today · Progress · Explore · Profile. */
export const TABS: TabItem[] = [
  { key: "today", label: "Today", href: "/", icon: Home },
  { key: "progress", label: "Progress", href: "/progress", icon: LineChart },
  { key: "explore", label: "Explore", href: "/explore", icon: Compass },
  { key: "profile", label: "Profile", href: "/profile", icon: User },
];

export function activeTab(pathname: string): TabKey {
  if (pathname === "/" || pathname === "") return "today";
  const seg = pathname.split("/")[1];
  const match = TABS.find((t) => t.href === `/${seg}`);
  return match?.key ?? "today";
}
