import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { KanbanBoard } from "./components/KanbanBoard";
import { ClientManager } from "./components/ClientManager";
import { TicketManager } from "./components/TicketManager";
import { AdminPanel } from "./components/AdminPanel";
import { SubscriptionManager } from "./components/SubscriptionManager";
import { Login } from "./components/Login";
import "./App.css";

const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

  if (loading) {
    return (
      <div style={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-app)",
        color: "var(--text-primary)"
      }}>
        <h2>Cargando Gestor de Proyectos...</h2>
      </div>
    );
  }

  // Si no está logueado, redirigir a Login
  if (!currentUser) {
    return <Login />;
  }

  return (
    <>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main style={{
        flexGrow: 1,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        minWidth: 0
      }}>
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "kanban" && <KanbanBoard />}
        {currentView === "clients" && <ClientManager />}
        {currentView === "tickets" && <TicketManager />}
        {currentView === "admin" && <AdminPanel />}
        {currentView === "subscriptions" && <SubscriptionManager />}
      </main>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
