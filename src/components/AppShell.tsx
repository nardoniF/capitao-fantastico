"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isHome && !isAdmin ? <SiteHeader variant="solid" /> : null}
      {children}
      {!isAdmin ? <SiteFooter /> : null}
      {!isAdmin ? <WhatsAppFloat /> : null}
    </>
  );
}
