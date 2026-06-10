import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuthStore, useToastStore } from "../store";
import {
  Avatar,
  IconBell,
  IconClipboardCheck,
  IconFolder,
  IconHome,
  IconLogout,
  IconMoon,
  IconScroll,
  IconShield,
  IconSun,
  IconUsers,
} from "./icons";

interface NotificationDto {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function useTheme() {
  const [theme, setTheme] = useState(localStorage.getItem("besidoc-theme") ?? "corporate");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("besidoc-theme", theme);
  }, [theme]);
  return { theme, toggle: () => setTheme(theme === "corporate" ? "dark" : "corporate") };
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { toasts } = useToastStore();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [notifications, setNotifications] = useState<{ unread: number; items: NotificationDto[] }>({
    unread: 0,
    items: [],
  });

  useEffect(() => {
    if (!user) return;
    const load = () =>
      api<{ unread: number; items: NotificationDto[] }>("/api/notifications")
        .then(setNotifications)
        .catch(() => undefined);
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <Outlet />;

  const navItems = [
    { to: "/", label: "Dashboard", icon: <IconHome /> },
    { to: "/service-groups", label: "Servicegruppen", icon: <IconFolder /> },
    ...(user.role === "FACHLICHER_PRUEFER" || user.role === "REDAKTIONELLER_PRUEFER" || user.role === "ADMIN"
      ? [{ to: "/reviews", label: "Review-Queue", icon: <IconClipboardCheck /> }]
      : []),
    ...(user.role === "ADMIN"
      ? [
          { to: "/admin/users", label: "Benutzer", icon: <IconUsers /> },
          { to: "/admin/audit", label: "Audit-Log", icon: <IconScroll /> },
        ]
      : []),
  ];

  const roleLabel: Record<string, string> = {
    CREATOR: "Creator",
    FACHLICHER_PRUEFER: "Fachprüfung",
    REDAKTIONELLER_PRUEFER: "Redaktion",
    ADMIN: "Admin",
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Topbar */}
      <header className="navbar sticky top-0 z-40 bg-gradient-to-r from-primary via-primary to-secondary text-primary-content shadow-lg">
        <div className="flex-1 gap-3">
          <Link to="/" className="flex items-center gap-2.5 px-3 group">
            <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <IconShield className="w-5 h-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight">BesiDoc</span>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest opacity-75">
                BaFin-Dokumentation
              </span>
            </span>
          </Link>
        </div>

        <div className="flex-none gap-1.5">
          <button className="btn btn-ghost btn-circle" onClick={toggle} aria-label="Theme wechseln">
            {theme === "corporate" ? <IconMoon /> : <IconSun />}
          </button>

          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-circle" aria-label="Benachrichtigungen">
              <div className="indicator">
                <IconBell />
                {notifications.unread > 0 && (
                  <span className="badge badge-error badge-xs indicator-item font-bold">
                    {notifications.unread}
                  </span>
                )}
              </div>
            </button>
            <div
              tabIndex={0}
              className="dropdown-content z-50 card card-compact w-80 bg-base-100 text-base-content shadow-2xl border border-base-300"
            >
              <div className="card-body max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Benachrichtigungen</h3>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() =>
                      api("/api/notifications/read-all", { method: "POST" }).then(() =>
                        setNotifications((n) => ({ unread: 0, items: n.items.map((i) => ({ ...i, read: true })) }))
                      )
                    }
                  >
                    Alle gelesen
                  </button>
                </div>
                {notifications.items.length === 0 && (
                  <p className="text-sm opacity-60 py-4 text-center">Keine Benachrichtigungen</p>
                )}
                {notifications.items.map((n) => (
                  <button
                    key={n.id}
                    className={`text-left text-sm p-2.5 rounded-lg hover:bg-base-200 transition-colors border-l-4 ${
                      n.read ? "opacity-60 border-transparent" : "font-medium border-primary bg-primary/5"
                    }`}
                    onClick={() => {
                      api(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => undefined);
                      if (n.link) navigate(n.link);
                    }}
                  >
                    {n.message}
                    <span className="block text-[10px] opacity-50 mt-0.5">
                      {new Date(n.createdAt).toLocaleString("de-DE")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost gap-2.5 pl-2 pr-3 normal-case">
              <Avatar name={user.name} />
              <span className="hidden md:block text-left leading-tight">
                <span className="block text-sm font-semibold">{user.name}</span>
                <span className="block text-[10px] uppercase tracking-wider opacity-75">
                  {roleLabel[user.role] ?? user.role}
                </span>
              </span>
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-50 menu bg-base-100 text-base-content rounded-box shadow-2xl border border-base-300 w-56 p-2"
            >
              <li className="menu-title text-xs">{user.email}</li>
              <li>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <IconLogout className="w-4 h-4" /> Abmelden
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-60 min-h-[calc(100vh-4rem)] bg-base-100 border-r border-base-300 hidden lg:block">
          <ul className="menu p-3 gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `rounded-lg transition-colors ${isActive ? "active font-semibold" : ""}`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="px-5 mt-6 text-[10px] uppercase tracking-widest opacity-40">
            BesiDoc · v0.1
          </div>
        </nav>

        <main className="flex-1 p-4 md:p-8 max-w-full overflow-x-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation (D.7) */}
      <div className="btm-nav lg:hidden z-40 border-t border-base-300">
        {navItems.slice(0, 4).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            {item.icon}
            <span className="btm-nav-label text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="toast toast-end z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`alert shadow-lg ${
              t.type === "error" ? "alert-error" : t.type === "success" ? "alert-success" : "alert-info"
            }`}
          >
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
