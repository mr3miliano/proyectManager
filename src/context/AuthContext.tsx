import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
} from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'manager';
  avatarUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isMock: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string, role: 'admin' | 'developer' | 'manager') => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};

// Cuentas de prueba pre-configuradas para modo Mock
const MOCK_USERS_KEY = "proyectsolutions_mock_users";
const DEFAULT_MOCK_USERS: UserProfile[] = [
  { uid: "mock-admin", name: "Sofía Administradora", email: "admin@proyectos.com", role: "admin", status: "approved" },
  { uid: "mock-dev", name: "Carlos Desarrollador", email: "dev@proyectos.com", role: "developer", status: "approved" },
  { uid: "mock-mgr", name: "Laura Gerente", email: "manager@proyectos.com", role: "manager", status: "approved" },
  // Cuentas pendientes de aprobación para que el Admin pueda probar la funcionalidad de aceptar/rechazar
  { uid: "mock-pending-1", name: "Roberto Solicitante", email: "roberto@equipo.com", role: "developer", status: "pending" },
  { uid: "mock-pending-2", name: "Julia Aspirante", email: "julia@equipo.com", role: "manager", status: "pending" }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock] = useState(!isFirebaseConfigured);

  // Inicializar mock users en localStorage si no existen
  useEffect(() => {
    if (!localStorage.getItem(MOCK_USERS_KEY)) {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(DEFAULT_MOCK_USERS));
    }
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const profile = userDoc.data() as UserProfile;
              // Verificar si está aprobado
              if (profile.status === 'approved') {
                setCurrentUser(user);
                setUserProfile(profile);
              } else {
                // Si no está aprobado, forzar cierre de sesión
                await signOut(auth);
                setCurrentUser(null);
                setUserProfile(null);
              }
            } else {
              // Si no existe perfil en Firestore, crearlo como pendiente por defecto
              const newProfile: UserProfile = {
                uid: user.uid,
                name: user.displayName || user.email?.split("@")[0] || "Usuario",
                email: user.email || "",
                role: "developer",
                status: "pending"
              };
              await setDoc(doc(db, "users", user.uid), newProfile);
              await signOut(auth);
              setCurrentUser(null);
              setUserProfile(null);
            }
          } catch (error) {
            console.error("Error al cargar perfil de Firestore:", error);
            await signOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Modo Mock
      const storedSession = localStorage.getItem("proyectsolutions_current_session");
      if (storedSession) {
        const profile = JSON.parse(storedSession) as UserProfile;
        // Si el estado cambió a pendiente o rechazado desde otra parte, invalidar sesión
        const users: UserProfile[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
        const found = users.find(u => u.uid === profile.uid);
        if (found && found.status === 'approved') {
          setUserProfile(found);
          setCurrentUser({ uid: found.uid, email: found.email } as any);
        } else {
          localStorage.removeItem("proyectsolutions_current_session");
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    }
  }, [isMock]);

  const login = async (email: string, password: string) => {
    if (isFirebaseConfigured && auth && db) {
      // Intentar loguear primero
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // Validar estado del perfil antes de permitir entrar
      const userDoc = await getDoc(doc(db, "users", credential.user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        if (profile.status === 'pending') {
          await signOut(auth);
          throw new Error("Tu solicitud de acceso está pendiente de aprobación por el administrador.");
        }
        if (profile.status === 'rejected') {
          await signOut(auth);
          throw new Error("Tu solicitud de acceso ha sido rechazada por el administrador.");
        }
        setCurrentUser(credential.user);
        setUserProfile(profile);
        return credential.user;
      } else {
        await signOut(auth);
        throw new Error("No se encontró un perfil asociado a este usuario.");
      }
    } else {
      // Autenticación Mock
      const users: UserProfile[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (found && password.endsWith("123")) {
        if (found.status === 'pending') {
          throw new Error("Tu solicitud de acceso está pendiente de aprobación por el administrador (Sofía).");
        }
        if (found.status === 'rejected') {
          throw new Error("Tu solicitud de acceso ha sido rechazada por el administrador.");
        }
        
        const userObj = { uid: found.uid, email: found.email } as any;
        setCurrentUser(userObj);
        setUserProfile(found);
        localStorage.setItem("proyectsolutions_current_session", JSON.stringify(found));
        return userObj;
      } else {
        throw new Error("Credenciales inválidas. En modo de prueba local, usa contraseñas que terminen en '123' (ej. admin123).");
      }
    }
  };

  const register = async (email: string, password: string, name: string, role: 'admin' | 'developer' | 'manager') => {
    if (isFirebaseConfigured && auth && db) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const newProfile: UserProfile = {
        uid: credential.user.uid,
        name,
        email,
        role,
        status: "pending" // Nuevos registros inician como pendientes
      };
      await setDoc(doc(db, "users", credential.user.uid), newProfile);
      // Desconectar inmediatamente porque requiere aprobación
      await signOut(auth);
      throw new Error("Registro exitoso. Tu solicitud de acceso ha sido enviada y está pendiente de aprobación.");
    } else {
      // Registro Mock
      const users: UserProfile[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("El correo electrónico ya está registrado.");
      }
      const newUid = `mock-${Date.now()}`;
      const newProfile: UserProfile = {
        uid: newUid,
        name,
        email,
        role,
        status: "pending" // Nuevos registros inician como pendientes
      };
      users.push(newProfile);
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      
      throw new Error("Registro local exitoso. Tu solicitud de acceso está pendiente. Pide a Sofía (Admin) que te apruebe desde su panel.");
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem("proyectsolutions_current_session");
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...profile } as UserProfile;
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "users", userProfile.uid), updated, { merge: true });
    } else {
      const users: UserProfile[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
      const idx = users.findIndex(u => u.uid === userProfile.uid);
      if (idx !== -1) {
        users[idx] = updated;
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      }
      localStorage.setItem("proyectsolutions_current_session", JSON.stringify(updated));
    }
    setUserProfile(updated);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, isMock, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
