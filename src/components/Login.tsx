import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, UserPlus, Info, CheckCircle } from "lucide-react";

export const Login: React.FC = () => {
  const { login, register, isMock } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'admin' | 'developer' | 'manager'>("developer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, name, role);
        setSuccess("Usuario registrado e iniciado sesión correctamente.");
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMockLogin = (mockEmail: string) => {
    setEmail(mockEmail);
    setPassword("admin123"); // Contraseña mock genérica
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      width: "100vw",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--bg-app)",
      padding: "2rem"
    }}>
      <div className="card" style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "2.5rem",
        width: "100%",
        maxWidth: "460px",
        boxShadow: "var(--shadow-lg)"
      }}>
        {/* Encabezado */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            padding: "0.75rem",
            backgroundColor: "var(--color-primary-light)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-primary)",
            marginBottom: "1rem"
          }}>
            {isRegister ? <UserPlus size={32} /> : <LogIn size={32} />}
          </div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            {isRegister ? "Crear Cuenta de Equipo" : "Iniciar Sesión"}
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {isRegister 
              ? "Regístrate para colaborar en proyectos y tickets" 
              : "Gestiona proyectos, facturación y soporte técnico"}
          </p>
        </div>

        {/* Banner informativo de base de datos */}
        <div style={{
          display: "flex",
          gap: "0.75rem",
          backgroundColor: isMock ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)",
          border: `1px solid ${isMock ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          marginBottom: "1.5rem",
          fontSize: "0.85rem",
          color: isMock ? "var(--color-warning)" : "var(--color-success)",
          alignItems: "flex-start"
        }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Modo de Almacenamiento: </strong>
            {isMock 
              ? "Persistencia local activada. Firebase no está configurado (usa contraseñas terminadas en '123' para pruebas)." 
              : "Conectado a Firebase Firestore en tiempo real."}
          </div>
        </div>

        {/* Mensajes de Error y Éxito */}
        {error && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--color-danger)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "var(--color-success)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {isRegister && (
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Ej. Sofía Pérez" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {isRegister && (
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Rol en el Equipo</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
                style={{ cursor: "pointer" }}
              >
                <option value="developer">Desarrollador (Técnico)</option>
                <option value="manager">Gerente de Cuentas / Negocios (Comercial)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.85rem" }} disabled={loading}>
            {loading ? "Procesando..." : isRegister ? "Registrar Cuenta" : "Entrar al Gestor"}
          </button>
        </form>

        {/* Toggle Modo */}
        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          <button 
            type="button" 
            onClick={() => setIsRegister(!isRegister)} 
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            {isRegister ? "¿Ya tienes una cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate aquí"}
          </button>
        </div>

        {/* Acceso Rápido Local (Solo en Modo Mock) */}
        {isMock && !isRegister && (
          <div style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px dashed var(--color-border)"
          }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem", textAlign: "center" }}>
              <strong>Acceso de Prueba Rápido (Local):</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button 
                type="button" 
                onClick={() => handleQuickMockLogin("admin@proyectos.com")}
                className="btn btn-outline" 
                style={{ padding: "0.4rem", fontSize: "0.8rem", justifyContent: "space-between" }}
              >
                <span>Administrador (Sofía)</span>
                <code style={{ fontSize: "0.75rem", padding: "1px 4px" }}>admin@proyectos.com</code>
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickMockLogin("dev@proyectos.com")}
                className="btn btn-outline" 
                style={{ padding: "0.4rem", fontSize: "0.8rem", justifyContent: "space-between" }}
              >
                <span>Desarrollador (Carlos)</span>
                <code style={{ fontSize: "0.75rem", padding: "1px 4px" }}>dev@proyectos.com</code>
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickMockLogin("manager@proyectos.com")}
                className="btn btn-outline" 
                style={{ padding: "0.4rem", fontSize: "0.8rem", justifyContent: "space-between" }}
              >
                <span>Gerente Comercial (Laura)</span>
                <code style={{ fontSize: "0.75rem", padding: "1px 4px" }}>manager@proyectos.com</code>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
