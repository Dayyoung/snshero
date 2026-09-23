import React, { createContext, useContext } from 'react';

export interface SnsContextType {
  sns: number;
  updateSns: (amount: number, reason?: string) => void;
  setCurrentDeck?: (deck: any) => void;
  selectedCompanionIndex?: number;
}

const SnsContext = createContext<SnsContextType>({
  sns: 0,
  updateSns: () => {},
});

export const useSns = () => useContext(SnsContext);

export const SnsProvider: React.FC<{
  sns: number;
  updateSns: (amount: number, reason?: string) => void;
  setCurrentDeck?: (deck: any) => void;
  selectedCompanionIndex?: number;
  children: React.ReactNode;
}> = ({ sns, updateSns, setCurrentDeck, selectedCompanionIndex, children }) => {
  return (
    <SnsContext.Provider value={{ sns, updateSns, setCurrentDeck, selectedCompanionIndex }}>
      {children}
    </SnsContext.Provider>
  );
};

export default SnsContext;
