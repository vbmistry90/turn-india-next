import { useState, useEffect } from "react";
import useSWR from "swr";
import Head from "next/head";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import useAuth from "@/hooks/useAuth";
import DashboardShellSkeleton from "@/components/skeletons/DashboardShellSkeleton";
import { timedFetcher } from "@/lib/apiClient";

const RADIUS_MAP = { none: "0px", sm: "6px", md: "10px", lg: "16px", full: "9999px" };
const TEXT_SIZE_MAP = { sm: "14px", md: "15px", lg: "16.5px" };

export default function DashboardLayout({ title = "Dashboard", children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, logout } = useAuth({ redirectOnFail: true });
  const { data: settingsData } = useSWR(user ? "/api/settings/theme" : null, timedFetcher);

  const settings = settingsData?.data;

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    root.style.setProperty("--brand-color", settings.themeColor || "#16a34a");
    root.style.setProperty("--brand-radius", RADIUS_MAP[settings.borderRadius] || "10px");
    root.style.setProperty("--brand-text-size", TEXT_SIZE_MAP[settings.baseTextSize] || "15px");
    root.style.setProperty("--brand-font", settings.fontFamily || "Inter");
  }, [settings]);

  if (isLoading) {
    return (
      <>
        <Head>
          <title>{title} · TurnIndia</title>
        </Head>
        <DashboardShellSkeleton />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{title} · TurnIndia</title>
      </Head>
      <div
        className="min-h-screen bg-ink-50 flex"
        style={{
          fontFamily: settings?.fontFamily ? `${settings.fontFamily}, sans-serif` : undefined,
          fontSize: "var(--brand-text-size, 15px)",
        }}
      >
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={user?.role} />

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
            user={user}
            onLogout={logout}
          />

          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </>
  );
}
