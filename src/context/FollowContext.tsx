// context/FollowContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FollowContextType {
  followState: Record<string, boolean>; // { [userId]: true/false }
  toggleFollow: (userId: string) => void;
  setFollowState: (userId: string, value: boolean) => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider = ({ children }: { children: ReactNode }) => {
  const [followState, setFollowStateInternal] = useState<Record<string, boolean>>({});

  const toggleFollow = (userId: string) => {
    setFollowStateInternal(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const setFollowState = (userId: string, value: boolean) => {
    setFollowStateInternal(prev => ({ ...prev, [userId]: value }));
  };

  return (
    <FollowContext.Provider value={{ followState, toggleFollow, setFollowState }}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) throw new Error("useFollow debe usarse dentro de FollowProvider");
  return context;
};
