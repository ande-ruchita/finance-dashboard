import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  User,
  MessageSquare,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const COLORS = {
  bg: "#282c35",
  panel: "#1a1c22",
  searchBg: "#282c35",
  border: "#242530",
  accent: "#1ed760",
  accentHover: "#17b950",
  text: "#fff",
  muted: "#9ca3af",
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", hash: "", active: true },
  { label: "Transactions", icon: ArrowLeftRight, path: "/dashboard", hash: "#transactions-table", active: true },
  { label: "Wallet", icon: Wallet, path: "#", hash: "", active: false },
  { label: "Analytics", icon: BarChart3, path: "#", hash: "", active: false },
  { label: "Personal", icon: User, path: "#", hash: "", active: false },
  { label: "Message", icon: MessageSquare, path: "#", hash: "", active: false },
  { label: "Setting", icon: Settings, path: "#", hash: "", active: false },
];

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function DashboardLayout({ title, children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = `Penta - ${title}`;
  }, [title]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        .db-sidebar {
          position: fixed;
          left: 0; top: 0; bottom: 0;
          z-index: 100;
        }
        .db-main-column {
          margin-left: 240px;
        }
        @media (max-width: 1024px) {
          .db-sidebar {
            transform: translateX(${sidebarOpen ? "0" : "-100%"});
            transition: transform 0.25s ease;
            box-shadow: ${sidebarOpen ? "4px 0 24px rgba(0,0,0,0.5)" : "none"};
          }
          .db-main-column {
            margin-left: 0;
          }
          .db-overlay {
            display: ${sidebarOpen ? "block" : "none"};
          }
          .db-hamburger { display: flex !important; }
          .db-topbar-search { display: none !important; }
          .db-main { padding: 16px !important; }
          .db-content-card { padding: 14px !important; border-radius: 14px !important; }
          .db-topbar { padding: 16px !important; }
        }
        @media (min-width: 1025px) {
          .db-hamburger { display: none !important; }
        }
      `}</style>

      {/* mobile overlay */}
      <div
        className="db-overlay"
        onClick={() => setSidebarOpen(false)}
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 90,
        }}
      />

      {/* Sidebar */}
      <aside
        className="db-sidebar"
        style={{
          width: 240,
          height: "100vh",
          flexShrink: 0,
          background: COLORS.panel,
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, paddingLeft: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="24" height="26" viewBox="0 0 26 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M20.929 4.88348H9.41797V0L25.8125 0V16.3945H20.929V4.88348Z" fill="#FFC01E"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M11.9375 14.6007C11.1917 14.1025 10.315 13.8365 9.41814 13.8365V8.95303C11.2809 8.95303 13.1018 9.5054 14.6506 10.5403C16.1994 11.5752 17.4065 13.0461 18.1194 14.767C18.8322 16.4879 19.0187 18.3816 18.6553 20.2086C18.2919 22.0355 17.3949 23.7137 16.0778 25.0308C14.7606 26.348 13.0825 27.2449 11.2555 27.6083C9.42857 27.9717 7.5349 27.7852 5.81396 27.0724C4.09302 26.3595 2.62211 25.1524 1.58723 23.6036C0.552357 22.0548 -3.54836e-06 20.2339 0 18.3712L4.88348 18.3712C4.88348 19.268 5.14943 20.1448 5.6477 20.8905C6.14598 21.6362 6.85419 22.2174 7.68279 22.5606C8.51139 22.9039 9.42316 22.9937 10.3028 22.8187C11.1824 22.6437 11.9904 22.2118 12.6246 21.5777C13.2588 20.9435 13.6907 20.1355 13.8657 19.2558C14.0406 18.3762 13.9508 17.4644 13.6076 16.6358C13.2644 15.8072 12.6832 15.099 11.9375 14.6007Z" fill="#1FCB4F"/>
            </svg>
            <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 22 }}>Penta</span>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: "transparent", border: "none", color: COLORS.muted, cursor: "pointer", display: "flex" }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
          {NAV_ITEMS.map(({ label, icon: Icon, path, hash, active }) => {
            const isCurrent =
              active &&
              location.pathname === path &&
              (hash ? location.hash === hash : !location.hash);
            return (
              <div key={label} style={{ position: "relative" }}>
                {isCurrent && (
                  <span
                    style={{
                      position: "absolute",
                      right: -16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 4,
                      height: 22,
                      borderRadius: "4px 0 0 4px",
                      background: "#ff8a3d",
                    }}
                  />
                )}
                <Link
                  to={active ? `${path}${hash}` : "#"}
                  onClick={(e) => {
                    if (!active) {
                      e.preventDefault();
                      return;
                    }
                    if (!hash) {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: isCurrent ? COLORS.accent : active ? COLORS.text : COLORS.muted,
                    fontWeight: isCurrent ? 600 : 500,
                    fontSize: 14,
                    cursor: active ? "pointer" : "default",
                    opacity: active ? 1 : 0.45,
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={17} color={isCurrent ? COLORS.accent : "currentColor"} />
                  </span>
                  {label}
                </Link>
              </div>
            );
          })}
        </nav>

        <div style={{ flexGrow: 1 }} />

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 8,
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* Main column */}
      <div className="db-main-column" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          className="db-topbar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 32px",
            background: COLORS.panel,
            borderBottom: `1px solid ${COLORS.border}`,
            flexShrink: 0,
            gap: 12,
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button
              className="db-hamburger"
              onClick={() => setSidebarOpen(true)}
              style={{
                display: "none",
                background: COLORS.panel,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.text,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Menu size={18} />
            </button>
            <h1 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {title}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
            <div
              className="db-topbar-search"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: COLORS.searchBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: "10px 16px",
                width: 260,
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: COLORS.text,
                  fontSize: 14,
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
              <Search size={16} color={COLORS.muted} />
            </div>

            <button
              style={{
                background: "transparent",
                border: "none",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Bell size={19} color={COLORS.text} />
            </button>

            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: COLORS.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              U
            </div>
          </div>
        </header>

        <main className="db-main" style={{ flex: 1, padding: 32, overflowY: "auto" }}>
          <div className="db-content-card" style={{ background: COLORS.bg, borderRadius: 20, padding: 24 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}