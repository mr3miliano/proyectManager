import React, { useState, useEffect } from "react";
import { dataService } from "../services/dataService";
import type { Ticket, Project } from "../services/dataService";
import { useAuth } from "../context/AuthContext";
import { 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  Plus, 
  ArrowRight,
  ClipboardList
} from "lucide-react";

export const TicketManager: React.FC = () => {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<{ uid: string; name: string; email: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario nuevo ticket
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<'bug' | 'feature_request' | 'other'>("bug");
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>("medium");
  const [newProjId, setNewProjId] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  // Detalle del ticket seleccionado
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ticketsData = await dataService.getTickets();
      const projsData = await dataService.getProjects();
      const teamData = await dataService.getTeamMembers();
      
      setTickets(ticketsData);
      setProjects(projsData);
      setTeam(teamData);

      if (projsData.length > 0) {
        setNewProjId(projsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newProjId) return;

    try {
      await dataService.addTicket({
        projectId: newProjId,
        title: newTitle,
        description: newDesc,
        type: newType,
        status: "open",
        priority: newPriority,
        reporterId: userProfile?.uid || "unknown",
        assigneeId: newAssignee || ""
      });

      setNewTitle("");
      setNewDesc("");
      setNewType("bug");
      setNewPriority("medium");
      setNewAssignee("");
      setShowModal(false);
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await dataService.updateTicket(ticketId, { status: newStatus });
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTicket = async (ticketId: string, assigneeId: string) => {
    try {
      await dataService.updateTicket(ticketId, { assigneeId });
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, assigneeId } : null);
      }

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertToKanban = async (ticket: Ticket) => {
    try {
      // 1. Crear la tarea en Kanban a partir del ticket de soporte
      await dataService.addTask({
        projectId: ticket.projectId,
        title: `[TICKET #${ticket.id.substring(0,4)}] ${ticket.title}`,
        description: `Creado desde ticket de soporte de tipo ${ticket.type.toUpperCase()}.\n\nDescripción del ticket:\n${ticket.description}`,
        status: "todo",
        priority: ticket.priority,
        assigneeId: ticket.assigneeId || userProfile?.uid || "",
        estimatedHours: ticket.type === 'bug' ? 4 : 8, // Tiempos estimados estándar iniciales
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Vence en 7 días
        ticketId: ticket.id
      });

      // 2. Actualizar el estado del ticket a "En Progreso"
      await dataService.updateTicket(ticket.id, { status: "in_progress" });
      
      alert("¡El ticket ha sido clonado y convertido en una tarea en el Tablero Kanban del proyecto!");
      
      setSelectedTicket(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este ticket de soporte permanentemente?")) return;
    try {
      await dataService.deleteTicket(ticketId);
      setSelectedTicket(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug size={18} style={{ color: "var(--color-danger)" }} />;
      case 'feature_request': return <Lightbulb size={18} style={{ color: "var(--color-warning)" }} />;
      default: return <HelpCircle size={18} style={{ color: "var(--color-primary)" }} />;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      default: return 'badge-indigo';
    }
  };

  return (
    <div style={{ padding: "2.5rem", width: "100%", display: "flex", flexDirection: "column", gap: "2rem", overflowY: "auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Centro de Soporte Técnico</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Reporta bugs, solicita mejoras de producto y conviértelos directamente en tareas técnicas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Reportar Bug / Mejora</span>
        </button>
      </div>

      {/* Main Container */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h3>Cargando tickets de soporte...</h3>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "1.5rem",
          alignItems: "flex-start"
        }}>
          {/* Lado Izquierdo: Lista de Tickets */}
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ClipboardList size={20} style={{ color: "var(--color-primary)" }} />
              Tickets Registrados
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "550px", overflowY: "auto" }}>
              {tickets.map(ticket => {
                const proj = projects.find(p => p.id === ticket.projectId);
                const reporter = team.find(u => u.uid === ticket.reporterId);
                const assignee = team.find(u => u.uid === ticket.assigneeId);

                return (
                  <div 
                    key={ticket.id} 
                    onClick={() => setSelectedTicket(ticket)}
                    style={{
                      border: selectedTicket?.id === ticket.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      backgroundColor: selectedTicket?.id === ticket.id ? "var(--color-primary-light)" : "var(--bg-app)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {getTypeIcon(ticket.type)}
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)" }}>
                          {ticket.type === 'bug' ? 'BUG' : ticket.type === 'feature_request' ? 'MEJORA' : 'SOPORTE'}
                        </span>
                      </div>
                      <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`} style={{ fontSize: "0.6rem" }}>
                        {ticket.priority}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>{ticket.title}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Proyecto: <strong>{proj?.name}</strong></p>

                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      borderTop: "1px dashed var(--color-border)",
                      paddingTop: "0.5rem",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: "0.25rem"
                    }}>
                      <span>Reportó: {reporter ? reporter.name.split(" ")[0] : "Anon"}</span>
                      <span>Asignado: <strong>{assignee ? assignee.name.split(" ")[0] : "Sin asignar"}</strong></span>
                      <span className={`badge ${
                        ticket.status === 'open' 
                          ? 'badge-indigo' 
                          : ticket.status === 'in_progress' 
                            ? 'badge-warning' 
                            : 'badge-success'
                      }`} style={{ fontSize: "0.6rem" }}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {tickets.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontStyle: "italic", padding: "2rem" }}>
                  Aún no se han reportado incidencias de soporte.
                </p>
              )}
            </div>
          </div>

          {/* Lado Derecho: Detalles y Acciones del Ticket Seleccionado */}
          {selectedTicket ? (
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
              {/* Encabezado del Detalle */}
              <div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                  {getTypeIcon(selectedTicket.type)}
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>
                    Ticket #{selectedTicket.id.substring(0, 6)}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{selectedTicket.title}</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Reportado el {selectedTicket.createdAt}
                </p>
              </div>

              {/* Descripción */}
              <div>
                <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Detalle del Reporte:</h4>
                <p style={{ 
                  fontSize: "0.9rem", 
                  backgroundColor: "var(--bg-app)", 
                  padding: "0.75rem", 
                  borderRadius: "var(--radius-md)" 
                }}>
                  {selectedTicket.description}
                </p>
              </div>

              {/* Asignación y Flujo de Trabajo */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                
                {/* Asignación */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                    Asignar Responsable:
                  </label>
                  <select 
                    value={selectedTicket.assigneeId} 
                    onChange={(e) => handleAssignTicket(selectedTicket.id, e.target.value)}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <option value="">Sin Asignar</option>
                    {team.map(member => (
                      <option key={member.uid} value={member.uid}>{member.name} ({member.role})</option>
                    ))}
                  </select>
                </div>

                {/* Cambio de Estado */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                    Estado del Soporte:
                  </label>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {['open', 'in_progress', 'resolved', 'closed'].map(st => (
                      <button 
                        key={st}
                        className="btn btn-outline" 
                        onClick={() => handleUpdateStatus(selectedTicket.id, st as any)}
                        style={{ 
                          padding: "0.35rem 0.65rem", 
                          fontSize: "0.75rem",
                          backgroundColor: selectedTicket.status === st ? "var(--color-primary-light)" : "transparent",
                          borderColor: selectedTicket.status === st ? "var(--color-primary)" : "var(--color-border)",
                          color: selectedTicket.status === st ? "var(--color-primary)" : "var(--text-primary)",
                          textTransform: "uppercase"
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BOTÓN DE CONVERSIÓN CRÍTICO (TECNICO / NEGOCIO) */}
                <div style={{
                  backgroundColor: "var(--color-primary-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  marginTop: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem"
                }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
                    Acción del Programador
                  </span>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Copia automáticamente este ticket y publícalo como una tarea en la columna "Por Hacer" del Kanban del proyecto.
                  </p>
                  <button 
                    className="btn btn-primary" 
                    style={{ fontSize: "0.85rem", gap: "0.5rem" }}
                    onClick={() => handleConvertToKanban(selectedTicket)}
                  >
                    <span>Pasar al Tablero Kanban</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {userProfile?.role === 'admin' && (
                  <div style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem",
                    marginTop: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem"
                  }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-danger)" }}>
                      Acción Administrativa (Admin)
                    </span>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      Elimina este ticket permanentemente del sistema de soporte.
                    </p>
                    <button 
                      className="btn" 
                      style={{ 
                        fontSize: "0.85rem", 
                        gap: "0.5rem",
                        backgroundColor: "var(--color-danger)",
                        color: "white",
                        border: "none",
                        justifyContent: "center",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        borderRadius: "var(--radius-md)",
                        padding: "0.5rem 1rem"
                      }}
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                    >
                      <span>Eliminar Ticket</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <h3>Selecciona un ticket de soporte de la lista para gestionar su resolución.</h3>
            </div>
          )}
        </div>
      )}

      {/* Modal Reportar Ticket */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: "1.5rem" }}>Reportar Ticket de Soporte</h3>
            <form onSubmit={handleCreateTicket} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Título de la Incidencia</label>
                <input 
                  type="text" 
                  placeholder="Ej. El botón de facturación da error 404" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Tipo de Ticket</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value as any)}>
                  <option value="bug">Bug / Error de Programación</option>
                  <option value="feature_request">Solicitud de Nueva Funcionalidad</option>
                  <option value="other">Otro / Consulta general</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Descripción del Problema</label>
                <textarea 
                  placeholder="Describe detalladamente el error o la mejora que deseas, incluyendo los pasos para reproducir." 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="modal-grid-equal">
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Prioridad</label>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as any)}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Responsable Sugerido</label>
                  <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
                    <option value="">Sin Asignar</option>
                    {team.map(member => (
                      <option key={member.uid} value={member.uid}>{member.name} ({member.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Enviar Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
