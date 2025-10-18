import React, { createContext, useContext, useState, useEffect } from 'react';
import { connectWallet, checkWalletConnected, getCurrentAddress } from '../utils/provider';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState('');

  const initializeWallet = async () => {
    try {
      setLoading(true);
      const isConnected = await checkWalletConnected();
      console.log("Wallet check result:", isConnected);
      
      if (isConnected) {
        await connectWallet();
        const address = await getCurrentAddress();
        setAccount(address);
        setWalletConnected(true);
        console.log("Wallet initialized with address:", address);
      } else {
        setWalletConnected(false);
        setAccount('');
      }
    } catch (error) {
      console.error('Wallet initialization failed:', error);
      setWalletConnected(false);
      setAccount('');
    } finally {
      setLoading(false);
    }
  };

  const connect = async () => {
    try {
      setLoading(true);
      await connectWallet();
      const address = await getCurrentAddress();
      setAccount(address);
      setWalletConnected(true);
      console.log("Wallet connected:", address);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeWallet();
  }, []);

  return (
    <WalletContext.Provider value={{
      walletConnected,
      loading,
      account,
      connect,
      refresh: initializeWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
