import React, { useState, useEffect } from "react";
import { dataService } from "../services/dataService";
import type { Client } from "../services/dataService";
import { 
  CreditCard, 
  UserCheck, 
  Plus, 
  TrendingUp,
  Search
} from "lucide-react";

export const SubscriptionManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Registrar/actualizar venta
  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [subType, setSubType] = useState<1 | 2 | 3>(1);
  const [subStatus, setSubStatus] = useState<'active' | 'expired'>("active");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await dataService.getClients();
      setClients(data);
      if (data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSubPrice = (type: 1 | 2 | 3) => {
    if (type === 1) return 500;
    if (type === 2) return 1500;
    if (type === 3) return 2000;
    return 0;
  };

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    try {
      const price = getSubPrice(subType);
      const subscription = {
        type: subType,
        price,
        startDate,
        status: subStatus
      };

      await dataService.updateClient(selectedClientId, { subscription });
      
      setShowModal(false);
      loadClients();
      alert("¡Venta/Suscripción registrada con éxito para el cliente!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSubscription = async (clientId: string) => {
    if (!window.confirm("¿Seguro que deseas cancelar la suscripción de este cliente?")) return;
    try {
      await dataService.updateClient(clientId, { subscription: null });
      loadClients();
    } catch (err) {
      console.error(err);
    }
  };

  // Estadísticas comerciales
  const activeSubs = clients.filter(c => c.subscription && c.subscription.status === 'active');
  const monthlyRevenue = activeSubs.reduce((sum, c) => sum + (c.subscription ? c.subscription.price : 0), 0);
  
  const type1Count = activeSubs.filter(c => c.subscription?.type === 1).length;
  const type2Count = activeSubs.filter(c => c.subscription?.type === 2).length;
  const type3Count = activeSubs.filter(c => c.subscription?.type === 3).length;

  return (
    <div style={{ padding: "2.5rem", width: "100%", display: "flex", flexDirection: "column", gap: "2rem", overflowY: "auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Ventas y Suscripciones</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Registra ventas recurrentes y administra los niveles de membresía del equipo de clientes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Registrar Venta</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <h3>Cargando información de suscripciones...</h3>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* KPI Dashboard Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "1.5rem"
          }}>
            {/* Ingreso Mensual */}
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
                <TrendingUp size={24} />
              </div>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Ventas Mensuales (MRR)</span>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.1rem 0" }}>${monthlyRevenue.toLocaleString()} MXN</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Ingresos recurrentes activos</span>
              </div>
            </div>

            {/* Suscripciones Activas */}
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
                <UserCheck size={24} />
              </div>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Suscripciones Activas</span>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.1rem 0" }}>{activeSubs.length} Clientes</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>De {clients.length} clientes totales</span>
              </div>
            </div>

            {/* Distribución de Membresías */}
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
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-warning)"
              }}>
                <CreditCard size={24} />
              </div>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Tipo de Suscripción</span>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem", fontSize: "0.8rem", fontWeight: 600 }}>
                  <span style={{ color: "var(--color-primary)" }}>T1: {type1Count}</span>
                  <span style={{ color: "var(--color-warning)" }}>T2: {type2Count}</span>
                  <span style={{ color: "var(--color-success)" }}>T3: {type3Count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client Subscriptions Table */}
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
            boxShadow: "var(--shadow-sm)"
          }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CreditCard size={20} style={{ color: "var(--color-primary)" }} />
              Estado de Suscripción por Cliente
            </h3>

            <div style={{ position: "relative", margin: "1rem 0", maxWidth: "400px" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Buscar por nombre o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: "2.25rem",
                  fontSize: "0.9rem",
                  height: "38px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                  width: "100%"
                }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "0.75rem" }}>Cliente / Empresa</th>
                    <th style={{ padding: "0.75rem" }}>Representante</th>
                    <th style={{ padding: "0.75rem" }}>Suscripción</th>
                    <th style={{ padding: "0.75rem" }}>Precio Mensual</th>
                    <th style={{ padding: "0.75rem" }}>Fecha de Alta</th>
                    <th style={{ padding: "0.75rem" }}>Estado</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clients
                    .filter(client => 
                      client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      client.company.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(client => {
                      const sub = client.subscription;
                      return (
                        <tr key={client.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "1rem 0.75rem", fontWeight: 600 }}>{client.company}</td>
                          <td style={{ padding: "1rem 0.75rem", color: "var(--text-secondary)" }}>{client.name}</td>
                          <td style={{ padding: "1rem 0.75rem" }}>
                            {sub ? (
                              <span className="badge badge-indigo" style={{ fontWeight: 600 }}>
                                Tipo {sub.type}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Sin suscripción</span>
                            )}
                          </td>
                          <td style={{ padding: "1rem 0.75rem", fontWeight: 600 }}>
                            {sub ? `$${sub.price.toLocaleString()} MXN` : "-"}
                          </td>
                          <td style={{ padding: "1rem 0.75rem", color: "var(--text-secondary)" }}>
                            {sub ? sub.startDate : "-"}
                          </td>
                          <td style={{ padding: "1rem 0.75rem" }}>
                            {sub ? (
                              <span className={`badge ${sub.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                {sub.status === 'active' ? 'Activo' : 'Vencido'}
                              </span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: "var(--color-border)", color: "var(--text-muted)" }}>Inactivo</span>
                            )}
                          </td>
                          <td style={{ padding: "1rem 0.75rem", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                              <button
                                className="btn btn-outline"
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                                onClick={() => {
                                  setSelectedClientId(client.id);
                                  if (sub) {
                                    setSubType(sub.type);
                                    setSubStatus(sub.status);
                                    setStartDate(sub.startDate);
                                  }
                                  setShowModal(true);
                                }}
                              >
                                Gestionar
                              </button>
                              {sub && (
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                                  onClick={() => handleCancelSubscription(client.id)}
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {clients.filter(client => 
                    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    client.company.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "2rem", fontStyle: "italic", color: "var(--text-muted)", textAlign: "center" }}>
                        {clients.length === 0 ? "Aún no hay clientes registrados." : "No se encontraron coincidencias."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Modal Registrar/Actualizar Suscripción */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: "1.5rem" }}>Gestionar Venta / Suscripción</h3>
            <form onSubmit={handleRegisterSale} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Seleccionar Cliente</label>
                <select 
                  value={selectedClientId} 
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  required
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Tipo de Suscripción (MXN)</label>
                <select 
                  value={subType} 
                  onChange={(e) => setSubType(Number(e.target.value) as any)}
                  required
                >
                  <option value={1}>Tipo 1 ($500 MXN mensuales)</option>
                  <option value={2}>Tipo 2 ($1,500 MXN mensuales)</option>
                  <option value={3}>Tipo 3 ($2,000 MXN mensuales)</option>
                </select>
              </div>

              <div className="modal-grid-equal">
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Estado de Suscripción</label>
                  <select 
                    value={subStatus} 
                    onChange={(e) => setSubStatus(e.target.value as any)}
                    required
                  >
                    <option value="active">Activo</option>
                    <option value="expired">Vencido / Expirado</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Fecha de Alta</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Venta</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
