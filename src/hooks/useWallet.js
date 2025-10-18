import { useState, useEffect } from 'react';
import { connectWallet, checkWalletConnected } from '../utils/provider';

export function useWallet() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    try {
      setLoading(true);
      const isConnected = await checkWalletConnected();
      if (isConnected) {
        await connectWallet();
        setWalletConnected(true);
      } else {
        setWalletConnected(false);
      }
    } catch (error) {
      console.error('Wallet initialization failed:', error);
      setWalletConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const connect = async () => {
    try {
      setLoading(true);
      await connectWallet();
      setWalletConnected(true);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    walletConnected,
    loading,
    connect,
    refresh: initializeWallet
  };
}
