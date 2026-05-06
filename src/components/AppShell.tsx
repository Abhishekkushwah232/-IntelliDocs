"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SessionGate } from "@/components/SessionGate";
import { AppSidebar, MobileHeader } from "@/components/AppSidebar";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/chat": "Chat",
  "/documents": "Documents",
  "/history": "Chat history",
  "/summary": "Summary",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = useMemo(() => TITLES[pathname ?? ""] ?? "IntelliDocs", [pathname]);

  return (
    <SessionGate>
      <div className="flex min-h-screen bg-[var(--app-canvas)]">
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <AppSidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader title={title} onMenuClick={() => setMobileOpen(true)} />
          <main className="scrollbar-soft flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SessionGate>
  );
}
