// src/hooks/useRol.js
export const useRol = () => {
  const usuarioStorage = localStorage.getItem("usuario");
  if (usuarioStorage) {
    try {
      const usr = JSON.parse(usuarioStorage);
      const tipo = Number(usr.idtipoUsuario);
      return {
        tipoUsuario: tipo,
        esSoloLectura: tipo === 3, // Tutor
        esAdmin: tipo === 1,
        esOperador: tipo === 2
      };
    } catch (e) {}
  }
  return { tipoUsuario: null, esSoloLectura: false, esAdmin: false, esOperador: false };
};