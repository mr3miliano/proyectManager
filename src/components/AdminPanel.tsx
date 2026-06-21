import React, { useState, useEffect } from "react";
import { dataService } from "../services/dataService";
import { useAuth } from "../context/AuthContext";
import { 
  UserCheck, 
  UserX, 
  UserPlus, 
  ShieldAlert, 
  Check, 
  X, 
  RefreshCw 
} from "lucide-react";

export const AdminPanel: React.FC = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<{ uid: string; name: string; email: string; role: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await dataService.getTeamMembers();
      setUsers(allUsers);
    } catch (err) {
      console.error("Error al cargar miembros del equipo:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (uid: string, status: 'approved' | 'rejected') => {
    try {
      await dataService.updateUserStatus(uid, status);
      setMessage(`Usuario ${status === 'approved' ? 'aprobado' : 'denegado'} con éxito.`);
      setTimeout(() => setMessage(""), 3000);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'developer' | 'manager') => {
    try {
      await dataService.updateUserRole(uid, newRole);
      setMessage("Rol de usuario actualizado.");
      setTimeout(() => setMessage(""), 3000);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-danger)" }}>
        <ShieldAlert size={48} style={{ marginBottom: "1rem" }} />
        <h2>Acceso Denegado</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Solo los administradores globales del equipo pueden acceder a este panel de administración.
        </p>
      </div>
    );
  }

  const pendingRequests = users.filter(u => u.status === 'pending');
  const activeTeam = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  return (
    <div style={{ padding: "2.5rem", width: "100%", display: "flex", flexDirection: "column", gap: "2rem", overflowY: "auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Panel de Administración del Equipo</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Gestiona los accesos del equipo interno y define los roles de desarrollo y negocio.
          </p>
        </div>
        <button className="btn btn-outline" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Mensaje Informativo */}
      {message && (
        <div style={{
          backgroundColor: "var(--color-primary-light)",
          color: "var(--color-primary)",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          fontSize: "0.9rem",
          fontWeight: 500
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h3>Cargando miembros y solicitudes...</h3>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* SECCIÓN 1: Solicitudes de Registro Pendientes */}
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
            boxShadow: "var(--shadow-sm)"
          }}>
            <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-warning)" }}>
              <UserPlus size={20} />
              Solicitudes de Acceso Pendientes ({pendingRequests.length})
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pendingRequests.map(user => (
                <div key={user.uid} style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  backgroundColor: "var(--bg-app)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}>
                  <div>
                    <strong style={{ fontSize: "1rem", display: "block" }}>{user.name}</strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{user.email}</span>
                    <span className="badge badge-indigo" style={{ marginLeft: "0.5rem", fontSize: "0.7rem" }}>
                      Solicita: {user.role}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ color: "var(--color-success)", borderColor: "rgba(16, 185, 129, 0.3)", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}
                      onClick={() => handleUpdateStatus(user.uid, 'approved')}
                    >
                      <Check size={16} />
                      Aprobar
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.3)", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}
                      onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                    >
                      <X size={16} />
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1rem" }}>
                  No hay solicitudes de acceso pendientes en este momento.
                </p>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: Equipo Activo y Roles */}
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
            boxShadow: "var(--shadow-sm)"
          }}>
            <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary)" }}>
              <UserCheck size={20} />
              Miembros del Equipo Activos ({activeTeam.length})
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "0.75rem" }}>Nombre</th>
                    <th style={{ padding: "0.75rem" }}>Email</th>
                    <th style={{ padding: "0.75rem" }}>Rol de Acceso</th>
                    <th style={{ padding: "0.75rem" }}>Estado</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTeam.map(user => (
                    <tr key={user.uid} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "1rem 0.75rem", fontWeight: 500 }}>{user.name}</td>
                      <td style={{ padding: "1rem 0.75rem", color: "var(--text-secondary)" }}>{user.email}</td>
                      <td style={{ padding: "1rem 0.75rem" }}>
                        <select 
                          value={user.role} 
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                          style={{ width: "150px", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                          disabled={user.uid === userProfile?.uid} // Evitar auto-quitarse el admin
                        >
                          <option value="developer">Desarrollador</option>
                          <option value="manager">Negocios / Manager</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                      <td style={{ padding: "1rem 0.75rem" }}>
                        <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>Aprobado</span>
                      </td>
                      <td style={{ padding: "1rem 0.75rem", textAlign: "right" }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.2)", padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                          onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                          disabled={user.uid === userProfile?.uid} // Evitar bloquearse a sí mismo
                        >
                          Revocar Acceso
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN 3: Usuarios Denegados / Rechazados */}
          {rejectedUsers.length > 0 && (
            <div style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              boxShadow: "var(--shadow-sm)"
            }}>
              <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-danger)" }}>
                <UserX size={20} />
                Accesos Denegados / Revocados ({rejectedUsers.length})
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {rejectedUsers.map(user => (
                  <div key={user.uid} style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{user.name}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.75rem" }}>{user.email}</span>
                    </div>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "var(--color-success)" }}
                      onClick={() => handleUpdateStatus(user.uid, 'approved')}
                    >
                      Restaurar Acceso
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
