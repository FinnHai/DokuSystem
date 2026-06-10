import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuthStore, useToastStore } from "../store";

interface NotificationDto {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { toasts } = useToastStore();
  const navigate = useNavigate();
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
    { to: "/", label: "Dashboard" },
    { to: "/service-groups", label: "Servicegruppen" },
    ...(user.role === "FACHLICHER_PRUEFER" || user.role === "REDAKTIONELLER_PRUEFER" || user.role === "ADMIN"
      ? [{ to: "/reviews", label: "Review-Queue" }]
      : []),
    ...(user.role === "ADMIN"
      ? [
          { to: "/admin/users", label: "Benutzer" },
          { to: "/admin/audit", label: "Audit-Log" },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-primary text-primary-content shadow-md">
        <div className="flex-1">
          <Link to="/" className="text-xl font-bold px-4">
            BesiDoc
          </Link>
          <span className="text-sm opacity-75 hidden md:inline">BaFin-Dokumentationsverwaltung</span>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-circle" aria-label="Benachrichtigungen">
              <div className="indicator">
                🔔
                {notifications.unread > 0 && (
                  <span className="badge badge-error badge-sm indicator-item">{notifications.unread}</span>
                )}
              </div>
            </button>
            <div
              tabIndex={0}
              className="dropdown-content z-50 card card-compact w-80 bg-base-100 text-base-content shadow-xl"
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
                {notifications.items.length === 0 && <p className="text-sm opacity-60">Keine Benachrichtigungen</p>}
                {notifications.items.map((n) => (
                  <button
                    key={n.id}
                    className={`text-left text-sm p-2 rounded hover:bg-base-200 ${n.read ? "opacity-60" : "font-semibold"}`}
                    onClick={() => {
                      api(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => undefined);
                      if (n.link) navigate(n.link);
                    }}
                  >
                    {n.message}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost">
              {user.name} <span className="badge badge-outline badge-sm ml-1">{user.role}</span>
            </button>
            <ul tabIndex={0} className="dropdown-content z-50 menu bg-base-100 text-base-content rounded-box shadow-xl w-52">
              <li>
                <button onClick={() => { logout(); navigate("/login"); }}>Abmelden</button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex">
        <nav className="w-56 min-h-[calc(100vh-4rem)] bg-base-100 shadow-md hidden lg:block">
          <ul className="menu p-4 gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1 p-6 max-w-full overflow-x-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation (D.7) */}
      <div className="btm-nav lg:hidden z-40">
        {navItems.slice(0, 4).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            <span className="btm-nav-label text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="toast toast-end z-50">
        {toasts.map((t) => (
          <div key={t.id} className={`alert ${t.type === "error" ? "alert-error" : t.type === "success" ? "alert-success" : "alert-info"}`}>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
