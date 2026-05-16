import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const UsageContext = createContext();

export function UsageProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [usageData, setUsageData] = useState(null);

  const fetchUsage = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API}/api/user/${user.id}/usage`);
      const data = await response.json();
      if (data.success) {
        setUsageData(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchUsage();
    }
  }, [isLoaded, user?.id, fetchUsage]);

  return (
    <UsageContext.Provider value={{ usageData, fetchUsage, setUsageData }}>
      {children}
    </UsageContext.Provider>
  );
}

export const useUsage = () => useContext(UsageContext);
