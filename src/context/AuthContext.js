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
  // Si el usuario pertenece a más de una institución, queda pendiente de
  // selección (institucionSeleccionada = false) hasta que elija una.
  const login = (usuario) => {
    const entidades = Array.isArray(usuario?.entidades) ? usuario.entidades : [];
    const usuarioConEstado = {
      ...usuario,
      entidades,
      institucionSeleccionada: entidades.length <= 1,
    };

    setUser(usuarioConEstado);

    localStorage.setItem(
      "usuario",
      JSON.stringify(usuarioConEstado)
    );
  };

  // ==========================================
  // SELECCIONAR INSTITUCIÓN
  // ==========================================
  // Pide al backend un nuevo token para la institución elegida
  const seleccionarInstitucion = async (entidad) => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/usuarios/cambiar-institucion`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ identidadeducativa: entidad.identidadeducativa }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.mensaje || "No se pudo seleccionar la institución");
    }

    localStorage.setItem("token", data.token);

    setUser((prev) => {
      const actualizado = {
        ...prev,
        identidadeducativa: data.identidadeducativa,
        entidadeducativa: data.entidadeducativa,
        institucionSeleccionada: true,
      };
      localStorage.setItem("usuario", JSON.stringify(actualizado));
      return actualizado;
    });
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

  const requiereSeleccionInstitucion =
    user !== null && user.institucionSeleccionada === false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuth: user !== null,
        login,
        logout,
        updateUser,
        seleccionarInstitucion,
        requiereSeleccionInstitucion,
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