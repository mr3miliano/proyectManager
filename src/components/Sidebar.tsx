import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Columns, 
  Users, 
  Ticket, 
  LogOut, 
  Sun, 
  Moon,
  Shield,
  CreditCard
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { userProfile, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "kanban", label: "Tablero Kanban", icon: Columns },
    { id: "clients", label: "Clientes y Negocios", icon: Users },
    { id: "tickets", label: "Tickets de Soporte", icon: Ticket },
    { id: "subscriptions", label: "Suscripciones y Ventas", icon: CreditCard }
  ];

  if (userProfile?.role === "admin") {
    navItems.push({ id: "admin", label: "Administración", icon: Shield });
  }

  return (
    <div style={{
      width: "260px",
      backgroundColor: "var(--bg-sidebar)",
      borderRight: "1px solid var(--color-border)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
      flexShrink: 0
    }}>
      {/* Brand Logo */}
      <div style={{
        padding: "1.5rem 2rem",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          backgroundColor: "var(--color-primary)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: "1.2rem"
        }}>
          P
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Proyectos</h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>& Soluciones CRM</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        padding: "1.5rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        flexGrow: 1
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className="btn"
              style={{
                justifyContent: "flex-start",
                padding: "0.75rem 1rem",
                width: "100%",
                backgroundColor: isActive ? "var(--color-primary-light)" : "transparent",
                color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
                borderRadius: "var(--radius-md)",
                fontWeight: isActive ? 600 : 400
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session & Settings */}
      <div style={{
        padding: "1.5rem 1rem",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        {/* User Card */}
        {userProfile && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.5rem"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "var(--color-primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "var(--color-primary)",
              textTransform: "uppercase"
            }}>
              {userProfile.name.substring(0, 2)}
            </div>
            <div style={{ minWidth: 0, flexGrow: 1 }}>
              <h4 style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                margin: 0,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>{userProfile.name}</h4>
              <span className={`badge ${
                userProfile.role === 'admin' 
                  ? 'badge-danger' 
                  : userProfile.role === 'manager' 
                    ? 'badge-indigo' 
                    : 'badge-success'
              }`} style={{ fontSize: "0.65rem", padding: "1px 6px", marginTop: "2px" }}>
                {userProfile.role === 'admin' 
                  ? 'Administrador' 
                  : userProfile.role === 'manager' 
                    ? 'Negocios' 
                    : 'Desarrollador'}
              </span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* Light/Dark Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn btn-outline"
            style={{
              flexGrow: 1,
              padding: "0.5rem",
              borderRadius: "var(--radius-md)"
            }}
            title="Alternar Modo Oscuro/Claro"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span style={{ fontSize: "0.85rem" }}>{darkMode ? "Claro" : "Oscuro"}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="btn btn-outline"
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              color: "var(--color-danger)",
              borderColor: "rgba(239, 68, 68, 0.2)"
            }}
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
