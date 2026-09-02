import Link from "next/link";
import { useRouter } from "next/router";
import {
  MdDashboard,
  MdOutlineVideoLibrary,
  MdOutlinePayments,
  MdOutlineMailOutline,
  MdEco,
  MdClose,
  MdPerson,
  MdOutlinePeople,
  MdOutlinePalette,
  MdOutlinePermMedia,
  MdOutlineMonitorHeart,
} from "react-icons/md";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: MdDashboard },
  { href: "/dashboard/videos", label: "Project Videos", icon: MdOutlineVideoLibrary },
  { href: "/dashboard/payments", label: "Payments", icon: MdOutlinePayments },
  { href: "/dashboard/contacts", label: "Inquiries", icon: MdOutlineMailOutline },
  { href: "/dashboard/media", label: "Media Library", icon: MdOutlinePermMedia },
  { href: "/dashboard/health", label: "Health Monitor", icon: MdOutlineMonitorHeart },
  { href: "/dashboard/profile", label: "My Profile", icon: MdPerson },
  { href: "/dashboard/users", label: "Manage Users", icon: MdOutlinePeople, adminOnly: true },
  { href: "/dashboard/appearance", label: "Appearance", icon: MdOutlinePalette, adminOnly: true },
];

export default function Sidebar({ open, onClose, role }) {
  const router = useRouter();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-ink-900 text-white z-40 transform transition-transform duration-200 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <MdEco className="text-primary-400" size={24} />
            <span>TurnIndia Admin</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white">
            <MdClose size={22} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? router.pathname === "/dashboard"
                : router.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? "bg-primary-600 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 text-xs text-ink-400 shrink-0">
          Turn India Admin Dashboard v2.0
        </div>
      </aside>
    </>
  );
}
