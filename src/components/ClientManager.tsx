import React, { useState, useEffect } from "react";
import { dataService } from "../services/dataService";
import type { Client } from "../services/dataService";
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Building,
  Edit2,
  Trash2,
  CreditCard
} from "lucide-react";

export const ClientManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Formularios
  const [showClientModal, setShowClientModal] = useState(false);

  // Campos cliente
  const [cName, setCName] = useState("");
  const [cCompany, setCCompany] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");

  // Estados para Edición de Cliente
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await dataService.getClients();
      setClients(data);
      if (data.length > 0) {
        setSelectedClient(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cCompany || !cName) return;

    try {
      const newClient = await dataService.addClient({
        name: cName,
        company: cCompany,
        email: cEmail,
        phone: cPhone,
        contracts: [],
        billingMilestones: []
      });

      setCName("");
      setCCompany("");
      setCEmail("");
      setCPhone("");
      setShowClientModal(false);
      
      // Actualizar listado y seleccionar el nuevo
      const updated = await dataService.getClients();
      setClients(updated);
      setSelectedClient(newClient);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = () => {
    if (!selectedClient) return;
    setEditName(selectedClient.name);
    setEditCompany(selectedClient.company);
    setEditEmail(selectedClient.email);
    setEditPhone(selectedClient.phone || "");
    setShowEditModal(true);
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !editCompany || !editName) return;

    try {
      const updates = {
        name: editName,
        company: editCompany,
        email: editEmail,
        phone: editPhone
      };
      await dataService.updateClient(selectedClient.id, updates);

      const updatedClient = { ...selectedClient, ...updates };
      setSelectedClient(updatedClient);
      
      // Actualizar listado global
      const updatedList = await dataService.getClients();
      setClients(updatedList);
      
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar al cliente "${selectedClient.company}"? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;

    try {
      await dataService.deleteClient(selectedClient.id);
      
      const updatedList = await dataService.getClients();
      setClients(updatedList);
      
      if (updatedList.length > 0) {
        setSelectedClient(updatedList[0]);
      } else {
        setSelectedClient(null);
      }
    } catch (err) {
      console.error(err);
    }
  };



  return (
    <div style={{ padding: "2.5rem", width: "100%", display: "flex", flexDirection: "column", gap: "2rem", overflowY: "auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Clientes y CRM</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Administra contactos comerciales y consulta su estado de suscripción.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowClientModal(true)}>
          <Plus size={18} />
          <span>Añadir Cliente</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h3>Cargando información comercial de clientes...</h3>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: "1.5rem",
          alignItems: "flex-start"
        }}>
          {/* Lado Izquierdo: Lista de Clientes */}
          <div style={{
            backgroundColor: "var(--bg-sidebar)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxHeight: "550px",
            overflowY: "auto",
            boxShadow: "var(--shadow-sm)"
          }}>
            <h3 style={{ fontSize: "1rem", padding: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} style={{ color: "var(--color-primary)" }} />
              Directorio de Clientes
            </h3>
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="btn"
                style={{
                  justifyContent: "flex-start",
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: selectedClient?.id === client.id ? "var(--color-primary-light)" : "transparent",
                  border: "1px solid transparent",
                  borderRadius: "var(--radius-md)",
                  color: selectedClient?.id === client.id ? "var(--color-primary)" : "var(--text-primary)",
                  fontWeight: selectedClient?.id === client.id ? 600 : 400
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.9rem" }}>{client.company}</div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>{client.name}</span>
                </div>
              </button>
            ))}
            {clients.length === 0 && (
              <p style={{ fontSize: "0.85rem", padding: "1rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
                Aún no hay clientes registrados.
              </p>
            )}
          </div>

          {/* Lado Derecho: Detalles, Contratos e Hitos del Cliente */}
          {selectedClient ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Información General del Cliente */}
              <div style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "1rem"
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.4rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Building size={22} style={{ color: "var(--color-primary)" }} />
                      {selectedClient.company}
                    </h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                      Representante: <strong>{selectedClient.name}</strong>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-outline" style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem" }} onClick={openEditModal}>
                      <Edit2 size={14} />
                      <span>Editar</span>
                    </button>
                    <button className="btn btn-outline" style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.2)" }} onClick={handleDeleteClient}>
                      <Trash2 size={14} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                    <Mail size={16} />
                    {selectedClient.email}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                    <Phone size={16} />
                    {selectedClient.phone}
                  </div>
                </div>
              </div>

              {/* Resumen de Suscripción */}
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
                  <CreditCard size={18} style={{ color: "var(--color-primary)" }} />
                  Resumen de Suscripción
                </h3>

                {selectedClient.subscription ? (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1.5rem",
                    backgroundColor: "var(--bg-sidebar)",
                    padding: "1.25rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)"
                  }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Nivel de Suscripción</div>
                      <strong style={{ fontSize: "1.1rem", color: "var(--color-primary)" }}>
                        {selectedClient.subscription.type === 1 ? "Plan Básico" : selectedClient.subscription.type === 2 ? "Plan Profesional" : "Plan Premium"} (Nivel {selectedClient.subscription.type})
                      </strong>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Tarifa Mensual</div>
                      <strong style={{ fontSize: "1.1rem", color: "var(--color-success)" }}>
                        ${selectedClient.subscription.price.toLocaleString()} MXN
                      </strong>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Fecha de Inicio</div>
                      <span style={{ fontSize: "1rem", fontWeight: 500 }}>
                        {selectedClient.subscription.startDate}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Estado de Membresía</div>
                      <span className={`badge ${selectedClient.subscription.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ width: "fit-content" }}>
                        {selectedClient.subscription.status === 'active' ? 'Activo' : 'Expirado'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: "center",
                    padding: "2rem",
                    backgroundColor: "var(--bg-sidebar)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-md)"
                  }}>
                    <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>
                      Este cliente no cuenta con una suscripción o venta recurrente activa.
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                      Puedes registrar una suscripción desde el módulo de <strong>Ventas y Suscripciones</strong>.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <h3>Crea o selecciona un cliente para ver la información.</h3>
            </div>
          )}
        </div>
      )}

      {/* Modal Añadir Cliente */}
      {showClientModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: "1.5rem" }}>Añadir Nuevo Cliente</h3>
            <form onSubmit={handleAddClient} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Empresa / Organización</label>
                <input 
                  type="text" 
                  placeholder="Ej. Acme Corp" 
                  value={cCompany}
                  onChange={(e) => setCCompany(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Nombre del Representante</label>
                <input 
                  type="text" 
                  placeholder="Ej. Carlos Martínez" 
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Correo de Contacto</label>
                <input 
                  type="email" 
                  placeholder="contacto@empresa.com" 
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Teléfono</label>
                <input 
                  type="text" 
                  placeholder="+34 600 000 000" 
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowClientModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Modal Editar Cliente */}
      {showEditModal && selectedClient && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: "1.5rem" }}>Editar Cliente</h3>
            <form onSubmit={handleEditClient} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Empresa / Organización</label>
                <input 
                  type="text" 
                  placeholder="Ej. Acme Corp" 
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Nombre del Representante</label>
                <input 
                  type="text" 
                  placeholder="Ej. Carlos Martínez" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Correo de Contacto</label>
                <input 
                  type="email" 
                  placeholder="contacto@empresa.com" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Teléfono</label>
                <input 
                  type="text" 
                  placeholder="+34 600 000 000" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
