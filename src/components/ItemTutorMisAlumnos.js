import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Search, School, BookOpen, AlertCircle, CheckCircle, Users, CreditCard } from "lucide-react";

const ItemTutorMisAlumnos = () => {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const obtenerAlumnos = useCallback(async () => {
    if (!user?.usuario) return;

    setCargando(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/persons/AlumnosTutor/${user.usuario}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron obtener los alumnos asignados al tutor");
      }

      const data = await response.json();
      setAlumnos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar alumnos del tutor:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [user, token]);

  useEffect(() => {
    obtenerAlumnos();
  }, [obtenerAlumnos]);

  // Totales acumulados
  const totales = alumnos.reduce(
    (acc, al) => {
      acc.cuotas += Number(al.cantcuotasadeudadas || 0);
      acc.saldo += Number(al.saldoadeudado || 0);
      return acc;
    },
    { cuotas: 0, saldo: 0 }
  );

  return (
    <div className="w-full max-w-full p-2 sm:p-4">
      {/* 🔹 Tarjeta Superior de Resumen */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white p-5 rounded-xl shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" /> Mis Alumnos a Cargo
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Tutor: <span className="font-semibold text-white">{user?.nombre || user?.usuario}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg text-center min-w-[110px]">
            <p className="text-xs text-blue-200">Total Alumnos</p>
            <p className="text-lg font-bold">{alumnos.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg text-center min-w-[130px]">
            <p className="text-xs text-blue-200">Total Cuotas Impagas</p>
            <p className="text-lg font-bold text-amber-300">{totales.cuotas}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg text-center min-w-[130px]">
            <p className="text-xs text-blue-200">Total Adeudado</p>
            <p className="text-lg font-bold text-rose-300">
              ${totales.saldo.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2 rounded shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 🔹 Tabla de Alumnos */}
      <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full min-w-[750px] text-left text-sm text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-4 py-3 text-center w-20">Legajo</th>
              <th scope="col" className="px-5 py-3 font-bold text-gray-800">Nombre y Apellido</th>
              <th scope="col" className="px-4 py-3 text-center font-bold text-gray-800">DNI</th>
              <th scope="col" className="px-4 py-3">Curso / Grado</th>
              <th scope="col" className="px-4 py-3">Institución Educativa</th>
              <th scope="col" className="px-4 py-3 text-center font-bold text-gray-800">Total Cuotas Adeudadas</th>
              <th scope="col" className="px-5 py-3 text-right font-bold text-gray-800">Total Adeudado</th>
              <th scope="col" className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-sm">
            {cargando ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500 font-medium">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Cargando alumnos asignados...
                </td>
              </tr>
            ) : alumnos.length > 0 ? (
              alumnos.map((a, idx) => {
                const nombreCompleto = a.nombrealumno || `${a.apellidos || ""} ${a.nombres || ""}`;
                const dni = a.dni_alumno || a.dni || a.numero_documento || "-";
                const cuotasAdeudadas = Number(a.cantcuotasadeudadas || 0);
                const saldoAdeudado = Number(a.saldoadeudado || 0);

                return (
                  <tr
                    key={a.id_alumno || a.id_persona || idx}
                    className="bg-white hover:bg-blue-50/50 transition-colors"
                  >
                    {/* Legajo */}
                    <td className="px-4 py-3.5 text-center font-medium text-gray-600">
                      {a.legajo || "-"}
                    </td>

                    {/* 👤 Nombre y Apellido del Alumno */}
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {nombreCompleto}
                    </td>

                    {/* 🆔 DNI del Alumno */}
                    <td className="px-4 py-3.5 text-center font-mono font-medium text-gray-700">
                      {dni}
                    </td>

                    {/* Curso / Grado */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        {a.grado || "No asignado"}
                      </span>
                    </td>

                    {/* Institución Educativa */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        <School className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={a.nombreinstitucion || a.entidadeducativa}>
                          {a.nombreinstitucion || a.entidadeducativa || "Institución Principal"}
                        </span>
                      </span>
                    </td>

                    {/* 💳 Total de Cuotas Adeudadas */}
                    <td className="px-4 py-3.5 text-center">
                      {cuotasAdeudadas > 0 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                          {cuotasAdeudadas} {cuotasAdeudadas === 1 ? "cuota" : "cuotas"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5" /> Al día
                        </span>
                      )}
                    </td>

                    {/* 💲 Total Adeudado */}
                    <td className="px-5 py-3.5 text-right font-bold text-base">
                      {saldoAdeudado > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          ${saldoAdeudado.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">$0,00</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {/* 🔍 Lupa: Ficha completa del alumno */}
                        {a.id_persona ? (
                          <Link
                            to={`/personas/${a.id_persona}`}
                            className="inline-flex items-center justify-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Ver ficha de la persona"
                          >
                            <Search className="w-4 h-4" />
                          </Link>
                        ) : null}

                        {/* 💳 Tarjeta: Gestión de pagos / cuotas del alumno */}
                        {a.id_alumno ? (
                          <Link
                            to={`/gestion/SaldoAlumno/${a.id_alumno}`}
                            className="inline-flex items-center justify-center p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Ver gestión de pagos y cuotas del alumno"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">
                  <School className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-600">No hay alumnos asignados a este usuario tutor.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemTutorMisAlumnos;
