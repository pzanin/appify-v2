import React, { createContext, useContext } from 'react';

const ProtectedContentAssetsContext = createContext<ReadonlyMap<string, Blob> | null>(null);
const BuyerLogoutContext = createContext<(() => Promise<void>) | null>(null);
const BuyerIdentityContext = createContext<string | null>(null);

export function ProtectedContentAssetsProvider({ children, assets, buyerAccountId, onLogout }: { children: React.ReactNode; assets: ReadonlyMap<string, Blob>; buyerAccountId: string | null; onLogout: () => Promise<void> }) {
  return <BuyerIdentityContext.Provider value={buyerAccountId}><BuyerLogoutContext.Provider value={onLogout}><ProtectedContentAssetsContext.Provider value={assets}>{children}</ProtectedContentAssetsContext.Provider></BuyerLogoutContext.Provider></BuyerIdentityContext.Provider>;
}

export function useProtectedContentAssets() {
  return useContext(ProtectedContentAssetsContext);
}

export function useBuyerLogout() {
  return useContext(BuyerLogoutContext);
}

export function useBuyerIdentity() {
  return useContext(BuyerIdentityContext);
}
