import React, { createContext, useContext, useState, useEffect } from 'react';

const InstitutionContext = createContext();

export const InstitutionProvider = ({ children }) => {
  const [activeInstitutionId, setActiveInstitutionId] = useState(null);
  const [institutions, setInstitutions] = useState([]);

  const fetchInstitutions = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || '';

      const res = await fetch(`${baseUrl}/api/escuela/todas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        console.error(`Error HTTP ${res.status} al consultar /api/escuela/todas`);
        setInstitutions([]);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.data || data?.rows || []);

      setInstitutions(list);

      // Si hay escuelas y aún no hay una seleccionada, establece la primera como activa por defecto
      if (list.length > 0 && !activeInstitutionId) {
        const firstId = list[0].identidadeducativa || list[0].id_establecimiento || list[0].id;
        if (firstId) setActiveInstitutionId(firstId);
      }
    } catch (err) {
      console.error('Error al cargar la lista global de escuelas:', err);
      setInstitutions([]);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  return (
    <InstitutionContext.Provider value={{ 
      activeInstitutionId, 
      setActiveInstitutionId, 
      institutions: Array.isArray(institutions) ? institutions : [], 
      refreshInstitutions: fetchInstitutions 
    }}>
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = () => {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error('useInstitution debe usarse dentro de InstitutionProvider');
  }
  return context;
};