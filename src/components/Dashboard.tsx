import React, { useState, useEffect } from "react";
import { dataService } from "../services/dataService";
import type { Project, Client, Task, Ticket } from "../services/dataService";
import { 
  DollarSign, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  FolderKanban,
  FileText,
  Building,
  Calendar
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projsData = await dataService.getProjects();
      const clientsData = await dataService.getClients();
      const tasksData = await dataService.getTasks();
      const ticketsData = await dataService.getTickets();
      
      setProjects(projsData);
      setClients(clientsData);
      setTasks(tasksData);
      setTickets(ticketsData);
    } catch (error) {
      console.error("Error al cargar datos del Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
        <h3>Cargando información comercial...</h3>
      </div>
    );
  }

  // Proyecto único activo (el primer proyecto)
  const activeProject = projects[0];

  // Cálculos de Negocio
  const totalBudget = activeProject ? activeProject.budget : 0;
  const hourlyRate = activeProject ? activeProject.hourlyRate : 40;
  const projectClient = activeProject ? clients.find(c => c.id === activeProject.clientId) : null;
  
  // Calcular horas registradas y costos asociados
  let totalHours = 0;
  let totalCost = 0;

  tasks.forEach(t => {
    totalHours += t.loggedHours || 0;
    totalCost += (t.loggedHours || 0) * hourlyRate;
  });

  const margin = totalBudget - totalCost;
  const marginPercent = totalBudget > 0 ? (margin / totalBudget) * 100 : 100;
  const openTicketsCount = tickets.filter(tk => tk.status === 'open' || tk.status === 'in_progress').length;

  return (
    <div style={{ padding: "2.5rem", width: "100%", display: "flex", flexDirection: "column", gap: "2.5rem", overflowY: "auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Panel de Control</h1>
          <p style={{ color: "var(--text-secondary)" }}>Monitorea el progreso de desarrollo y la rentabilidad del proyecto.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "1.5rem"
      }}>
        {/* Presupuesto Comercial */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            padding: "0.75rem",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-success)"
          }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Presupuesto del Proyecto</span>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.1rem 0" }}>${totalBudget.toLocaleString()}</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tarifa acordada: ${hourlyRate}/hr</span>
          </div>
        </div>

        {/* Costos Registrados */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            padding: "0.75rem",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-primary)"
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Costo de Desarrollo</span>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.1rem 0" }}>${totalCost.toLocaleString()}</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{totalHours} hrs registradas</span>
          </div>
        </div>

        {/* Margen de Ganancia */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            padding: "0.75rem",
            backgroundColor: margin < 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
            borderRadius: "var(--radius-md)",
            color: margin < 0 ? "var(--color-danger)" : "var(--color-success)"
          }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Margen de Utilidad</span>
            <h3 style={{ 
              fontSize: "1.5rem", 
              fontWeight: 700, 
              margin: "0.1rem 0",
              color: margin < 0 ? "var(--color-danger)" : "var(--color-success)"
            }}>
              ${margin.toLocaleString()}
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {marginPercent.toFixed(0)}% restante
            </span>
          </div>
        </div>

        {/* Tickets Activos */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            padding: "0.75rem",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-danger)"
          }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Tickets Pendientes</span>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.1rem 0" }}>{openTicketsCount}</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Bugs y mejoras abiertos</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects List & Overview */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "1.5rem",
        alignItems: "flex-start"
      }}>
        {/* Project Details */}
        {activeProject ? (
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FolderKanban size={20} style={{ color: "var(--color-primary)" }} />
              Detalle del Proyecto Comercial
            </h3>
            
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.5rem" }}>{activeProject.name}</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                {activeProject.description}
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              borderTop: "1px solid var(--color-border)",
              paddingTop: "1.25rem",
              marginTop: "0.5rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Building size={20} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Cliente Asociado</span>
                  <strong style={{ fontSize: "0.9rem" }}>{projectClient ? projectClient.company : "Sin Cliente"}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Calendar size={20} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Fecha de Inicio</span>
                  <strong style={{ fontSize: "0.9rem" }}>{activeProject.createdAt}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Clock size={20} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Estado Técnico</span>
                  <span className={`badge badge-success`} style={{ fontSize: "0.65rem", marginTop: "2px" }}>
                    {activeProject.status === "active" ? "Activo" : "Planificación"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            textAlign: "center"
          }}>
            <h3>No hay ningún proyecto activo configurado en el sistema.</h3>
          </div>
        )}

        {/* Task Metrics & Distribution */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={20} style={{ color: "var(--color-primary)" }} />
            Progreso del Proyecto
          </h3>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              <span>Por Hacer</span>
              <strong>{tasks.filter(t => t.status === 'todo').length}</strong>
            </div>
            <div style={{ width: "100%", height: "8px", backgroundColor: "var(--color-border)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                backgroundColor: "var(--color-primary)", 
                width: `${tasks.length ? (tasks.filter(t => t.status === 'todo').length / tasks.length) * 100 : 0}%` 
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              <span>En Progreso</span>
              <strong>{tasks.filter(t => t.status === 'in_progress').length}</strong>
            </div>
            <div style={{ width: "100%", height: "8px", backgroundColor: "var(--color-border)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                backgroundColor: "var(--color-warning)", 
                width: `${tasks.length ? (tasks.filter(t => t.status === 'in_progress').length / tasks.length) * 100 : 0}%` 
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              <span>Completadas</span>
              <strong>{tasks.filter(t => t.status === 'done').length}</strong>
            </div>
            <div style={{ width: "100%", height: "8px", backgroundColor: "var(--color-border)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                backgroundColor: "var(--color-success)", 
                width: `${tasks.length ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}%` 
              }} />
            </div>
          </div>

          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "var(--bg-app)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)"
          }}>
            <strong>Progreso Total del Kanban:</strong>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0", color: "var(--color-success)" }}>
              {tasks.length ? ((tasks.filter(t => t.status === 'done').length / tasks.length) * 100).toFixed(0) : 0}%
            </h2>
            <span>Tareas terminadas sobre total en Kanban.</span>
          </div>
        </div>
      </div>

    </div>
  );
};
