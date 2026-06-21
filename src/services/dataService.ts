import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, Timestamp, getDoc 
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";

// Interfaces
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  contracts: { title: string; amount: number; status: 'active' | 'completed' | 'draft' }[];
  billingMilestones: { id: string; description: string; amount: number; dueDate: string; status: 'pending' | 'invoiced' | 'paid' }[];
  subscription?: {
    type: 1 | 2 | 3;
    price: number;
    startDate: string;
    status: 'active' | 'expired';
  } | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  budget: number;
  hourlyRate: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  createdAt: any;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeId: string;
  estimatedHours: number;
  loggedHours: number;
  dueDate: string;
  createdAt: any;
}

export interface Ticket {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'bug' | 'feature_request' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  reporterId: string;
  assigneeId: string;
  createdAt: any;
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  description: string;
  timestamp: any;
}

// Claves de LocalStorage
const PROJECTS_KEY = "proyectsolutions_projects";
const TASKS_KEY = "proyectsolutions_tasks";
const CLIENTS_KEY = "proyectsolutions_clients";
const TICKETS_KEY = "proyectsolutions_tickets";
const TIMELOGS_KEY = "proyectsolutions_timelogs";
const USERS_KEY = "proyectsolutions_mock_users";

// Datos Iniciales Mock
const INITIAL_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Juan Pérez",
    company: "Innovatech Solutions",
    email: "juan@innovatech.com",
    phone: "+54 11 5555-1234",
    contracts: [
      { title: "Desarrollo Core SaaS", amount: 15000, status: "active" },
      { title: "Soporte Anual Premium", amount: 3000, status: "draft" }
    ],
    billingMilestones: [
      { id: "m1", description: "Hito 1: Entrega de Prototipo de Interfaz", amount: 5000, dueDate: "2026-07-15", status: "paid" },
      { id: "m2", description: "Hito 2: Integración de pasarela de pagos", amount: 5000, dueDate: "2026-08-30", status: "pending" },
      { id: "m3", description: "Hito 3: Lanzamiento Oficial y Producción", amount: 5000, dueDate: "2026-10-15", status: "pending" }
    ],
    subscription: {
      type: 2,
      price: 1500,
      startDate: "2026-05-15",
      status: "active"
    }
  },
  {
    id: "c2",
    name: "Ana Gómez",
    company: "Global Retail Corp",
    email: "ana.gomez@globalretail.com",
    phone: "+56 9 8765-4321",
    contracts: [
      { title: "App Móvil de Fidelización", amount: 8000, status: "active" }
    ],
    billingMilestones: [
      { id: "m4", description: "Hito Único: Entrega final y QA aprobado", amount: 8000, dueDate: "2026-09-01", status: "invoiced" }
    ],
    subscription: {
      type: 1,
      price: 500,
      startDate: "2026-06-01",
      status: "active"
    }
  }
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Desarrollo E-Commerce SaaS",
    description: "Crear una plataforma SaaS multi-tienda para pymes, con pasarela de pagos integrada y panel de administración.",
    clientId: "c1",
    budget: 15000,
    hourlyRate: 50,
    status: "active",
    createdAt: "2026-05-10"
  }
];

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    projectId: "p1",
    title: "Configurar Base de Datos Firestore y Auth",
    description: "Diseñar el modelo de datos inicial y configurar las reglas de seguridad en Firebase console.",
    status: "done",
    priority: "high",
    assigneeId: "mock-dev",
    estimatedHours: 8,
    loggedHours: 9,
    dueDate: "2026-06-25",
    createdAt: "2026-06-10"
  },
  {
    id: "t2",
    projectId: "p1",
    title: "Implementar Pasarela de Pagos Stripe",
    description: "Crear endpoints del servidor mock o integración frontend para realizar cobros seguros.",
    status: "in_progress",
    priority: "high",
    assigneeId: "mock-dev",
    estimatedHours: 20,
    loggedHours: 12,
    dueDate: "2026-07-05",
    createdAt: "2026-06-12"
  },
  {
    id: "t3",
    projectId: "p1",
    title: "Maquetado de Panel de Estadísticas",
    description: "Diseñar gráficos interactivos y componentes del dashboard utilizando SVG y CSS moderno.",
    status: "todo",
    priority: "medium",
    assigneeId: "mock-admin",
    estimatedHours: 12,
    loggedHours: 0,
    dueDate: "2026-07-10",
    createdAt: "2026-06-15"
  },
  {
    id: "t4",
    projectId: "p1",
    title: "Diseño UX/UI en Figma",
    description: "Crear prototipos interactivos y paleta de colores para la app móvil.",
    status: "done",
    priority: "medium",
    assigneeId: "mock-mgr",
    estimatedHours: 15,
    loggedHours: 15,
    dueDate: "2026-06-18",
    createdAt: "2026-06-01"
  },
  {
    id: "t5",
    projectId: "p1",
    title: "Configuración inicial de React Native",
    description: "Estructurar carpetas, configurar TypeScript y dependencias esenciales de navegación.",
    status: "todo",
    priority: "high",
    assigneeId: "mock-dev",
    estimatedHours: 10,
    loggedHours: 0,
    dueDate: "2026-07-02",
    createdAt: "2026-06-14"
  }
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "tk1",
    projectId: "p1",
    title: "Error 500 al procesar pago internacional",
    description: "Al intentar realizar un pago con una tarjeta del extranjero, la API retorna error interno. Parece un problema con la divisa.",
    type: "bug",
    status: "open",
    priority: "high",
    reporterId: "mock-mgr",
    assigneeId: "mock-dev",
    createdAt: "2026-06-19"
  },
  {
    id: "tk2",
    projectId: "p1",
    title: "Soporte para múltiples idiomas (i18n)",
    description: "El cliente solicita traducir el dashboard al menos a inglés y portugués para sus sucursales internacionales.",
    type: "feature_request",
    status: "in_progress",
    priority: "medium",
    reporterId: "mock-mgr",
    assigneeId: "mock-admin",
    createdAt: "2026-06-18"
  },
  {
    id: "tk3",
    projectId: "p1",
    title: "Modo oscuro en la pantalla de inicio",
    description: "La paleta de la aplicación debe adaptarse al modo oscuro configurado en el sistema operativo del usuario.",
    type: "feature_request",
    status: "resolved",
    priority: "low",
    reporterId: "mock-dev",
    assigneeId: "mock-dev",
    createdAt: "2026-06-15"
  }
];

const INITIAL_TIMELOGS: TimeLog[] = [
  { id: "tl1", taskId: "t1", userId: "mock-dev", hours: 5, description: "Estructura inicial en Firestore", timestamp: "2026-06-10" },
  { id: "tl2", taskId: "t1", userId: "mock-dev", hours: 4, description: "Configuración de reglas de seguridad", timestamp: "2026-06-11" },
  { id: "tl3", taskId: "t2", userId: "mock-dev", hours: 6, description: "Maquetado del formulario de Stripe", timestamp: "2026-06-12" },
  { id: "tl4", taskId: "t2", userId: "mock-dev", hours: 6, description: "Conexión preliminar con backend de pagos", timestamp: "2026-06-13" },
  { id: "tl5", taskId: "t4", userId: "mock-mgr", hours: 15, description: "Diseño UX y Wireframes en Figma", timestamp: "2026-06-05" }
];

// Función auxiliar para inicializar la base de datos Mock
const initMockDB = () => {
  if (!localStorage.getItem(CLIENTS_KEY)) localStorage.setItem(CLIENTS_KEY, JSON.stringify(INITIAL_CLIENTS));
  if (!localStorage.getItem(PROJECTS_KEY)) localStorage.setItem(PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
  if (!localStorage.getItem(TASKS_KEY)) localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
  if (!localStorage.getItem(TICKETS_KEY)) localStorage.setItem(TICKETS_KEY, JSON.stringify(INITIAL_TICKETS));
  if (!localStorage.getItem(TIMELOGS_KEY)) localStorage.setItem(TIMELOGS_KEY, JSON.stringify(INITIAL_TIMELOGS));
};

initMockDB();

// Adaptador de Datos (Firebase Firestore / LocalStorage Mock)
export const dataService = {
  
  // CLIENTES
  async getClients(): Promise<Client[]> {
    if (isFirebaseConfigured && db) {
      const snap = await getDocs(collection(db, "clients"));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    } else {
      return JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
    }
  },

  async addClient(client: Omit<Client, 'id'>): Promise<Client> {
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, "clients"), client);
      return { id: docRef.id, ...client };
    } else {
      const clients = await this.getClients();
      const newClient = { id: `c-${Date.now()}`, ...client };
      clients.push(newClient);
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      return newClient;
    }
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "clients", id), updates);
    } else {
      const clients = await this.getClients();
      const idx = clients.findIndex(c => c.id === id);
      if (idx !== -1) {
        clients[idx] = { ...clients[idx], ...updates };
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      }
    }
  },

  async deleteClient(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "clients", id));
    } else {
      const clients = await this.getClients();
      const filtered = clients.filter(c => c.id !== id);
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(filtered));
    }
  },

  // PROYECTOS
  async getProjects(): Promise<Project[]> {
    if (isFirebaseConfigured && db) {
      const snap = await getDocs(collection(db, "projects"));
      return snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString().split("T")[0] : data.createdAt
        } as Project;
      });
    } else {
      return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    }
  },

  async addProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const createdAt = new Date().toISOString().split("T")[0];
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, "projects"), { ...project, createdAt: Timestamp.fromDate(new Date()) });
      return { id: docRef.id, createdAt, ...project };
    } else {
      const projects = await this.getProjects();
      const newProj = { id: `p-${Date.now()}`, createdAt, ...project };
      projects.push(newProj);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      return newProj;
    }
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "projects", id), updates);
    } else {
      const projects = await this.getProjects();
      const idx = projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        projects[idx] = { ...projects[idx], ...updates } as Project;
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      }
    }
  },

  // TAREAS
  async getTasks(projectId?: string): Promise<Task[]> {
    if (isFirebaseConfigured && db) {
      let q = collection(db, "tasks");
      const snap = projectId 
        ? await getDocs(query(q, where("projectId", "==", projectId)))
        : await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    } else {
      const tasks: Task[] = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
      return projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
    }
  },

  async addTask(task: Omit<Task, 'id' | 'loggedHours' | 'createdAt'>): Promise<Task> {
    const createdAt = new Date().toISOString().split("T")[0];
    const newTaskData = { ...task, loggedHours: 0, createdAt };
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, "tasks"), newTaskData);
      return { id: docRef.id, ...newTaskData };
    } else {
      const tasks = await this.getTasks();
      const newTask = { id: `t-${Date.now()}`, ...newTaskData };
      tasks.push(newTask);
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      return newTask;
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "tasks", id), updates);
    } else {
      const tasks = await this.getTasks();
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], ...updates } as Task;
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      }
    }
  },

  async deleteTask(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "tasks", id));
    } else {
      const tasks = await this.getTasks();
      const filtered = tasks.filter(t => t.id !== id);
      localStorage.setItem(TASKS_KEY, JSON.stringify(filtered));
    }
  },

  // TICKETS
  async getTickets(): Promise<Ticket[]> {
    if (isFirebaseConfigured && db) {
      const snap = await getDocs(collection(db, "tickets"));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
    } else {
      return JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]");
    }
  },

  async addTicket(ticket: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> {
    const createdAt = new Date().toISOString().split("T")[0];
    const newTicketData = { ...ticket, createdAt };
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, "tickets"), newTicketData);
      return { id: docRef.id, ...newTicketData };
    } else {
      const tickets = await this.getTickets();
      const newTicket = { id: `tk-${Date.now()}`, ...newTicketData };
      tickets.push(newTicket);
      localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
      return newTicket;
    }
  },

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "tickets", id), updates);
    } else {
      const tickets = await this.getTickets();
      const idx = tickets.findIndex(tk => tk.id === id);
      if (idx !== -1) {
        tickets[idx] = { ...tickets[idx], ...updates } as Ticket;
        localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
      }
    }
  },

  // TIME LOGS
  async getTimeLogs(taskId?: string): Promise<TimeLog[]> {
    if (isFirebaseConfigured && db) {
      let q = collection(db, "timeLogs");
      const snap = taskId 
        ? await getDocs(query(q, where("taskId", "==", taskId)))
        : await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeLog));
    } else {
      const logs: TimeLog[] = JSON.parse(localStorage.getItem(TIMELOGS_KEY) || "[]");
      return taskId ? logs.filter(l => l.taskId === taskId) : logs;
    }
  },

  async addTimeLog(log: Omit<TimeLog, 'id' | 'timestamp'>): Promise<TimeLog> {
    const timestamp = new Date().toISOString().split("T")[0];
    const newLogData = { ...log, timestamp };
    
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, "timeLogs"), newLogData);
      // Actualizar también las horas registradas en la tarea
      const taskDoc = doc(db, "tasks", log.taskId);
      const taskSnap = await getDoc(taskDoc);
      if (taskSnap.exists()) {
        const currHours = taskSnap.data().loggedHours || 0;
        await updateDoc(taskDoc, { loggedHours: currHours + log.hours });
      }
      return { id: docRef.id, ...newLogData };
    } else {
      const logs = await this.getTimeLogs();
      const newLog = { id: `tl-${Date.now()}`, ...newLogData };
      logs.push(newLog);
      localStorage.setItem(TIMELOGS_KEY, JSON.stringify(logs));
      
      // Actualizar la tarea en localStorage
      const tasks: Task[] = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
      const tIdx = tasks.findIndex(t => t.id === log.taskId);
      if (tIdx !== -1) {
        tasks[tIdx].loggedHours = (tasks[tIdx].loggedHours || 0) + log.hours;
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      }
      return newLog;
    }
  },

  // MIEMBROS DEL EQUIPO
  async getTeamMembers(): Promise<{ uid: string; name: string; email: string; role: string; status: string }[]> {
    if (isFirebaseConfigured && db) {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any));
    } else {
      return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    }
  },

  async updateUserStatus(uid: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "users", uid), { status });
    } else {
      const users = await this.getTeamMembers();
      const idx = users.findIndex(u => u.uid === uid);
      if (idx !== -1) {
        users[idx].status = status;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
  },

  async updateUserRole(uid: string, role: 'admin' | 'developer' | 'manager'): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "users", uid), { role });
    } else {
      const users = await this.getTeamMembers();
      const idx = users.findIndex(u => u.uid === uid);
      if (idx !== -1) {
        users[idx].role = role;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
  }
};
