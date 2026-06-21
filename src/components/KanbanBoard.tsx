import React, { useState, useEffect } from "react";
import { dataService } from "../services/dataService";
import type { Project, Task, TimeLog } from "../services/dataService";
import { useAuth } from "../context/AuthContext";
import { 
  Plus, 
  Clock, 
  User, 
  Trash2, 
  Calendar, 
  Activity
} from "lucide-react";

export const KanbanBoard: React.FC = () => {
  const { userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<{ uid: string; name: string; email: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskLogs, setTaskLogs] = useState<TimeLog[]>([]);

  // Campos nueva tarea
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>("medium");
  const [newAssignee, setNewAssignee] = useState("");
  const [newEstHours, setNewEstHours] = useState(4);
  const [newDueDate, setNewDueDate] = useState("");

  // Campos nuevo log de tiempo
  const [logHours, setLogHours] = useState(1);
  const [logDesc, setLogDesc] = useState("");

  useEffect(() => {
    loadProjects();
    loadTeam();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadTasks();
    } else {
      setTasks([]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedTask) {
      loadTaskLogs(selectedTask.id);
    }
  }, [selectedTask]);

  const loadProjects = async () => {
    try {
      const projs = await dataService.getProjects();
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTeam = async () => {
    try {
      const users = await dataService.getTeamMembers();
      setTeam(users);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const taskList = await dataService.getTasks(selectedProjectId);
      setTasks(taskList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskLogs = async (taskId: string) => {
    try {
      const logs = await dataService.getTimeLogs(taskId);
      setTaskLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Permitir soltar
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: 'todo' | 'in_progress' | 'done') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    try {
      // Actualizar localmente primero
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
      
      // Actualizar en base de datos
      await dataService.updateTask(taskId, { status: targetStatus });
    } catch (err) {
      console.error("Error al mover tarea:", err);
      loadTasks(); // Deshacer cambios recargando
    }
  };

  // Acciones
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !selectedProjectId) return;

    try {
      await dataService.addTask({
        projectId: selectedProjectId,
        title: newTitle,
        description: newDesc,
        status: "todo",
        priority: newPriority,
        assigneeId: newAssignee || userProfile?.uid || "",
        estimatedHours: Number(newEstHours),
        dueDate: newDueDate || new Date().toISOString().split("T")[0]
      });

      // Reset
      setNewTitle("");
      setNewDesc("");
      setNewPriority("medium");
      setNewAssignee("");
      setNewEstHours(4);
      setNewDueDate("");
      setShowCreateModal(false);
      
      // Recargar
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta tarea técnica?")) return;
    try {
      await dataService.deleteTask(taskId);
      setSelectedTask(null);
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !logHours) return;

    try {
      await dataService.addTimeLog({
        taskId: selectedTask.id,
        userId: userProfile?.uid || "unknown",
        hours: Number(logHours),
        description: logDesc || "Registro de desarrollo técnico"
      });

      setLogHours(1);
      setLogDesc("");
      
      // Actualizar horas en el modal del detalle de tarea
      const updatedTask = { ...selectedTask, loggedHours: (selectedTask.loggedHours || 0) + Number(logHours) };
      setSelectedTask(updatedTask);
      loadTaskLogs(selectedTask.id);
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Renderizar columnas de Kanban
  const renderColumn = (status: 'todo' | 'in_progress' | 'done', title: string, badgeClass: string) => {
    const filteredTasks = tasks.filter(t => t.status === status);
    
    return (
      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
        style={{
          backgroundColor: "var(--bg-sidebar)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          minHeight: "450px",
          width: "100%",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        {/* Column Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className={`badge ${badgeClass}`}>{title}</span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>{filteredTasks.length}</span>
        </div>

        {/* Task Cards Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", flexGrow: 1 }}>
          {filteredTasks.map(task => {
            const assignee = team.find(u => u.uid === task.assigneeId);
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => setSelectedTask(task)}
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  boxShadow: "var(--shadow-sm)",
                  cursor: "grab",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className={`badge ${
                    task.priority === 'high' 
                      ? 'badge-danger' 
                      : task.priority === 'medium' 
                        ? 'badge-warning' 
                        : 'badge-indigo'
                  }`} style={{ fontSize: "0.6rem" }}>
                    {task.priority}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
                    <Calendar size={12} />
                    {task.dueDate}
                  </span>
                </div>

                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>{task.title}</h4>
                <p style={{ 
                  fontSize: "0.85rem", 
                  color: "var(--text-secondary)", 
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>{task.description}</p>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--color-border)"
                }}>
                  {/* Horas */}
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={14} />
                    {task.loggedHours}/{task.estimatedHours} hrs
                  </span>

                  {/* Asignado */}
                  <span style={{ 
                    fontSize: "0.8rem", 
                    color: "var(--text-secondary)", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "4px",
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    <User size={14} />
                    {assignee ? assignee.name.split(" ")[0] : "Sin asignar"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div style={{ padding: "2.5rem", width: "100%", display: "flex", flexDirection: "column", gap: "2rem", overflowY: "auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Tablero Kanban</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Arrastra y suelta tareas para actualizar su progreso en tiempo real.
          </p>
        </div>

        {/* Project Selector & Add Task */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>Crear Tarea</span>
          </button>
        </div>
      </div>

      {selectedProject && (
        <div style={{
          backgroundColor: "var(--color-primary-light)",
          color: "var(--color-primary)",
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          fontSize: "0.9rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <strong>Proyecto: </strong> {selectedProject.description}
          </div>
          <div>
            <strong>Tarifa: </strong> ${selectedProject.hourlyRate}/hr
          </div>
        </div>
      )}

      {/* Kanban Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h3>Cargando tablero...</h3>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem"
        }}>
          {renderColumn("todo", "Por Hacer", "badge-indigo")}
          {renderColumn("in_progress", "En Progreso", "badge-warning")}
          {renderColumn("done", "Completado", "badge-success")}
        </div>
      )}

      {/* Modal Crear Tarea */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: "1.5rem" }}>Nueva Tarea Técnica</h3>
            <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Título de la Tarea</label>
                <input 
                  type="text" 
                  placeholder="Ej. Configurar JWT Auth" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Descripción</label>
                <textarea 
                  placeholder="Describe los requerimientos técnicos y criterios de aceptación." 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
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
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Asignar Miembro</label>
                  <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
                    <option value="">Selecciona desarrollador</option>
                    {team.map(u => (
                      <option key={u.uid} value={u.uid}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-grid-equal">
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Estimación (horas)</label>
                  <input 
                    type="number" 
                    value={newEstHours}
                    onChange={(e) => setNewEstHours(Number(e.target.value))}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Fecha de Vencimiento</label>
                  <input 
                    type="date" 
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Añadir al Kanban</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle de Tarea & Registro de Horas (Time Tracking) */}
      {selectedTask && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "650px" }}>
            {/* Header Detalle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <span className={`badge ${
                  selectedTask.priority === 'high' 
                    ? 'badge-danger' 
                    : selectedTask.priority === 'medium' 
                      ? 'badge-warning' 
                      : 'badge-indigo'
                }`} style={{ marginBottom: "0.5rem" }}>
                  Prioridad: {selectedTask.priority}
                </span>
                <h3 style={{ fontSize: "1.3rem" }}>{selectedTask.title}</h3>
              </div>
              <button 
                className="btn btn-danger" 
                style={{ padding: "0.5rem" }}
                onClick={() => handleDeleteTask(selectedTask.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Contenido principal */}
            <div className="modal-grid-2">
              
              {/* Lado Izquierdo: Info & Logs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Descripción Técnica:</h4>
                  <p style={{ fontSize: "0.9rem", backgroundColor: "var(--bg-app)", padding: "0.75rem", borderRadius: "var(--radius-md)" }}>
                    {selectedTask.description || "Sin descripción proporcionada."}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Activity size={16} />
                    Logs de Desarrollo ({taskLogs.length})
                  </h4>
                  <div style={{ 
                    maxHeight: "160px", 
                    overflowY: "auto", 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "0.5rem" 
                  }}>
                    {taskLogs.map(log => {
                      const user = team.find(u => u.uid === log.userId);
                      return (
                        <div key={log.id} style={{
                          backgroundColor: "var(--bg-app)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "0.5rem 0.75rem",
                          fontSize: "0.8rem"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", marginBottom: "2px" }}>
                            <strong>{user ? user.name : "Desconocido"}</strong>
                            <span>{log.hours} hrs • {log.timestamp}</span>
                          </div>
                          <span style={{ color: "var(--text-primary)" }}>{log.description}</span>
                        </div>
                      );
                    })}
                    {taskLogs.length === 0 && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Aún no se han cargado horas en esta tarea.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lado Derecho: Time Logger Form */}
              <div className="modal-aside" style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "1.25rem" 
              }}>
                <div style={{ 
                  backgroundColor: "var(--color-primary-light)", 
                  padding: "0.75rem", 
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-primary)",
                  fontSize: "0.85rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span>Estimado:</span>
                    <strong>{selectedTask.estimatedHours} hrs</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Cargado:</span>
                    <strong>{selectedTask.loggedHours} hrs</strong>
                  </div>
                </div>

                <form onSubmit={handleLogTime} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <h4 style={{ fontSize: "0.9rem" }}>Registrar Tiempo de Trabajo</h4>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Horas invertidas</label>
                    <input 
                      type="number" 
                      step="0.5"
                      value={logHours} 
                      onChange={(e) => setLogHours(Number(e.target.value))} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>¿Qué se avanzó?</label>
                    <textarea 
                      placeholder="Ej. Se programó el endpoint..." 
                      value={logDesc} 
                      onChange={(e) => setLogDesc(e.target.value)} 
                      rows={2}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
                    Cargar Tiempo
                  </button>
                </form>
              </div>

            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedTask(null)}>Cerrar Detalle</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
