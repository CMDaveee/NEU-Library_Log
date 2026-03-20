import { createContext, useContext, useState, useEffect } from 'react';

const CampusContext = createContext();

export function CampusProvider({ children }) {
  const [campusId, setCampusId] = useState(() => {
    try { return localStorage.getItem('neu-campus') || 'qc-main'; }
    catch { return 'qc-main'; }
  });
  const [campuses, setCampuses] = useState([
    { id: 'qc-main', name: 'Quezon City Main Campus' },
  ]);

  useEffect(() => {
    try { localStorage.setItem('neu-campus', campusId); } catch {}
  }, [campusId]);

  return (
    <CampusContext.Provider value={{ campusId, setCampusId, campuses, setCampuses }}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  return useContext(CampusContext);
}
