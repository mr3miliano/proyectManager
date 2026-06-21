import React, { useState, useEffect } from "react";
import { dataService } from "../services/dataService";
import type { Client } from "../services/dataService";
import { 
  Users, 
  FileText, 
  DollarSign, 
  Plus, 
  Mail, 
  Phone, 
  Building,
  CheckCircle,
  FileCheck2
} from "lucide-react";

export const ClientManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Formularios
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // Campos cliente
  const [cName, setCName] = useState("");
  const [cCompany, setCCompany] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");

  // Campos contrato
  const [conTitle, setConTitle] = useState("");
  const [conAmount, setConAmount] = useState(1000);
  const [conStatus, setConStatus] = useState<'active' | 'completed' | 'draft'>("active");

  // Campos hito
  const [mileDesc, setMileDesc] = useState("");
  const [mileAmount, setMileAmount] = useState(500);
  const [mileDate, setMileDate] = useState("");

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

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !conTitle) return;

    try {
      const newContract = { title: conTitle, amount: Number(conAmount), status: conStatus };
      const updatedContracts = [...(selectedClient.contracts || []), newContract];
      
      await dataService.updateClient(selectedClient.id, { contracts: updatedContracts });
      
      setConTitle("");
      setConAmount(1000);
      setConStatus("active");
      setShowContractModal(false);
      
      // Actualizar vista
      const updatedClient = { ...selectedClient, contracts: updatedContracts };
      setSelectedClient(updatedClient);
      
      // Actualizar lista global
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !mileDesc) return;

    try {
      const newMilestone = {
        id: `m-${Date.now()}`,
        description: mileDesc,
        amount: Number(mileAmount),
        dueDate: mileDate || new Date().toISOString().split("T")[0],
        status: 'pending' as const
      };
      
      const updatedMilestones = [...(selectedClient.billingMilestones || []), newMilestone];
      await dataService.updateClient(selectedClient.id, { billingMilestones: updatedMilestones });

      setMileDesc("");
      setMileAmount(500);
      setMileDate("");
      setShowMilestoneModal(false);

      // Actualizar vista
      const updatedClient = { ...selectedClient, billingMilestones: updatedMilestones };
      setSelectedClient(updatedClient);
      
      // Actualizar lista global
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId: string, newStatus: 'pending' | 'invoiced' | 'paid') => {
    if (!selectedClient) return;

    try {
      const updatedMilestones = selectedClient.billingMilestones.map(m => 
        m.id === milestoneId ? { ...m, status: newStatus } : m
      );

      await dataService.updateClient(selectedClient.id, { billingMilestones: updatedMilestones });
      
      // Actualizar vista
      const updatedClient = { ...selectedClient, billingMilestones: updatedMilestones };
      setSelectedClient(updatedClient);
      
      // Actualizar lista global
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "2.5rem", width: "100%", display: "flex", flexDirection: "column", gap: "2rem", overflowY: "auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Clientes y Facturación</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Administra contactos comerciales, contratos activos e hitos de cobranza.
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
                <div>
                  <h3 style={{ fontSize: "1.4rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Building size={22} style={{ color: "var(--color-primary)" }} />
                    {selectedClient.company}
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                    Representante: <strong>{selectedClient.name}</strong>
                  </p>
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

              {/* Grid de Secciones: Contratos & Facturación */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                alignItems: "flex-start"
              }}>
                {/* Contratos */}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FileText size={18} style={{ color: "var(--color-primary)" }} />
                      Contratos Comerciales
                    </h3>
                    <button className="btn btn-outline" style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem" }} onClick={() => setShowContractModal(true)}>
                      <Plus size={14} />
                      <span>Contrato</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto" }}>
                    {selectedClient.contracts?.map((con, idx) => (
                      <div key={idx} style={{
                        border: "1px solid var(--color-border)",
                        padding: "0.85rem",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div>
                          <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{con.title}</div>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                            Estado: {con.status}
                          </span>
                        </div>
                        <strong style={{ color: "var(--color-success)", fontSize: "1rem" }}>
                          ${con.amount.toLocaleString()}
                        </strong>
                      </div>
                    ))}
                    {(!selectedClient.contracts || selectedClient.contracts.length === 0) && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
                        Sin contratos registrados.
                      </p>
                    )}
                  </div>
                </div>

                {/* Hitos de Facturación */}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <DollarSign size={18} style={{ color: "var(--color-primary)" }} />
                      Hitos de Cobro
                    </h3>
                    <button className="btn btn-outline" style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem" }} onClick={() => setShowMilestoneModal(true)}>
                      <Plus size={14} />
                      <span>Hito</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto" }}>
                    {selectedClient.billingMilestones?.map((mile) => (
                      <div key={mile.id} style={{
                        border: "1px solid var(--color-border)",
                        padding: "0.85rem",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{mile.description}</span>
                          <span className={`badge ${
                            mile.status === 'paid' 
                              ? 'badge-success' 
                              : mile.status === 'invoiced' 
                                ? 'badge-warning' 
                                : 'badge-indigo'
                          }`} style={{ fontSize: "0.6rem" }}>
                            {mile.status === 'paid' ? 'Pagado' : mile.status === 'invoiced' ? 'Facturado' : 'Pendiente'}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Vence: {mile.dueDate}</span>
                          <strong style={{ fontSize: "0.95rem" }}>${mile.amount.toLocaleString()}</strong>
                        </div>

                        {/* Controles de Estado de Pago */}
                        <div style={{
                          display: "flex",
                          gap: "0.4rem",
                          borderTop: "1px solid var(--color-border)",
                          paddingTop: "0.4rem",
                          marginTop: "0.25rem"
                        }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", flexGrow: 1 }}
                            onClick={() => handleUpdateMilestoneStatus(mile.id, 'invoiced')}
                            disabled={mile.status === 'invoiced' || mile.status === 'paid'}
                          >
                            <FileCheck2 size={12} />
                            Facturar
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", flexGrow: 1, color: "var(--color-success)", borderColor: "rgba(16, 185, 129, 0.2)" }}
                            onClick={() => handleUpdateMilestoneStatus(mile.id, 'paid')}
                            disabled={mile.status === 'paid'}
                          >
                            <CheckCircle size={12} />
                            Marcar Pagado
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!selectedClient.billingMilestones || selectedClient.billingMilestones.length === 0) && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>
                        Sin hitos de cobranza cargados.
                      </p>
                    )}
                  </div>
                </div>
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

      {/* Modal Añadir Contrato */}
      {showContractModal && selectedClient && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: "1.5rem" }}>Añadir Contrato a {selectedClient.company}</h3>
            <form onSubmit={handleAddContract} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Título del Contrato</label>
                <input 
                  type="text" 
                  placeholder="Ej. Integración Cloud y QA" 
                  value={conTitle}
                  onChange={(e) => setConTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-grid-equal">
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Monto de Contrato ($)</label>
                  <input 
                    type="number" 
                    value={conAmount}
                    onChange={(e) => setConAmount(Number(e.target.value))}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Estado</label>
                  <select value={conStatus} onChange={(e) => setConStatus(e.target.value as any)}>
                    <option value="active">Activo</option>
                    <option value="draft">Borrador (Draft)</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowContractModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Añadir Contrato</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Añadir Hito de Cobro */}
      {showMilestoneModal && selectedClient && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: "1.5rem" }}>Añadir Hito de Facturación</h3>
            <form onSubmit={handleAddMilestone} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Descripción del Hito</label>
                <input 
                  type="text" 
                  placeholder="Ej. Diseño UI aprobado por cliente" 
                  value={mileDesc}
                  onChange={(e) => setMileDesc(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-grid-equal">
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Monto del Hito ($)</label>
                  <input 
                    type="number" 
                    value={mileAmount}
                    onChange={(e) => setMileAmount(Number(e.target.value))}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Fecha Límite</label>
                  <input 
                    type="date" 
                    value={mileDate}
                    onChange={(e) => setMileDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Añadir Hito</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
