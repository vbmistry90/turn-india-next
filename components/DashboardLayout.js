import { useState } from "react";
import Head from "next/head";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import useAuth from "@/hooks/useAuth";

export default function DashboardLayout({ title = "Dashboard", children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, logout } = useAuth({ redirectOnFail: true });

  return (
    <>
      <Head>
        <title>{title} · Turn-India Admin</title>
      </Head>
      <div className="min-h-screen bg-ink-50 flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
            user={user}
            onLogout={logout}
          />

          <main className="flex-1 p-4 lg:p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 text-ink-400 text-sm">
                Loading...
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </>
  );
}
