// src/context/AuthContext.js

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // ==========================================
  // RECUPERAR SESIÓN
  // ==========================================
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    const token = localStorage.getItem("token");

    if (usuarioGuardado && token) {
      try {
        setUser(JSON.parse(usuarioGuardado));
      } catch (error) {
        console.error("Error al recuperar usuario:", error);

        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
        localStorage.removeItem("loginTime");
      }
    }
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================
  const login = (usuario) => {
    setUser(usuario);

    localStorage.setItem(
      "usuario",
      JSON.stringify(usuario)
    );
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = () => {
    setUser(null);

    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    localStorage.removeItem("loginTime");
  };

  // ==========================================
  // ACTUALIZAR USUARIO
  // ==========================================
  const updateUser = (nuevosDatos) => {
    setUser((prev) => {
      const actualizado = { ...prev, ...nuevosDatos };
      localStorage.setItem("usuario", JSON.stringify(actualizado));
      return actualizado;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuth: user !== null,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================
// HOOK PERSONALIZADO
// ==========================================
export function useAuth() {
  return useContext(AuthContext);
}