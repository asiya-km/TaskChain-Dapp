import { ethers, BrowserProvider, Contract } from "ethers";
import {
  TASKCHAIN_ABI,
  TASKCHAIN_ADDRESS,
  REWARDNFT_ABI,
  REWARDNFT_ADDRESS
} from "../utils/contractAbi";

let cachedProvider = null;
let cachedSigner = null;

// ✅ Check if wallet is already connected
export async function checkWalletConnected() {
  if (!window.ethereum) {
    console.log("MetaMask not installed");
    return false;
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_accounts", []);
    const isConnected = accounts && accounts.length > 0;
    console.log("Wallet connection status:", isConnected);
    return isConnected;
  } catch (error) {
    console.error("Error checking wallet connection:", error);
    return false;
  }
}

// ✅ Connect to MetaMask safely
export async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Please install it.");
    throw new Error("MetaMask not available");
  }

  try {
    const provider = new BrowserProvider(window.ethereum);

    // Check if already connected
    const accounts = await provider.send("eth_accounts", []);
    if (!accounts || accounts.length === 0) {
      console.log("No accounts found, requesting access...");
      try {
        await provider.send("eth_requestAccounts", []);
        console.log("Wallet access granted");
      } catch (err) {
        console.error("User denied MetaMask connection:", err);
        throw err;
      }
    } else {
      console.log("Wallet already connected:", accounts[0]);
    }

    cachedProvider = provider;
    cachedSigner = await provider.getSigner();
    
    const address = await cachedSigner.getAddress();
    console.log("Signer initialized with address:", address);
    
    return cachedSigner;
  } catch (error) {
    console.error("Error in connectWallet:", error);
    // Clear cached values on error
    cachedProvider = null;
    cachedSigner = null;
    throw error;
  }
}

// ✅ Get signer
export async function getSigner() {
  if (!cachedSigner) {
    console.log("No cached signer, connecting wallet...");
    await connectWallet();
  }
  
  try {
    const address = await cachedSigner.getAddress();
    console.log("Using signer with address:", address);
    return cachedSigner;
  } catch (error) {
    console.error("Error with cached signer, reconnecting...", error);
    // If cached signer is invalid, reconnect
    await connectWallet();
    return cachedSigner;
  }
}

// ✅ Get provider (useful for read-only operations)
export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask not available");
  }
  
  if (!cachedProvider) {
    cachedProvider = new BrowserProvider(window.ethereum);
  }
  return cachedProvider;
}

// ✅ TaskChain contract
export async function getTaskChainContract() {
  try {
    const signer = await getSigner();
    const contract = new Contract(TASKCHAIN_ADDRESS, TASKCHAIN_ABI, signer);
    console.log("TaskChain contract initialized at:", TASKCHAIN_ADDRESS);
    return contract;
  } catch (error) {
    console.error("Error initializing TaskChain contract:", error);
    throw error;
  }
}

// ✅ RewardNFT contract
export async function getRewardNFTContract() {
  try {
    const signer = await getSigner();
    const contract = new Contract(REWARDNFT_ADDRESS, REWARDNFT_ABI, signer);
    console.log("RewardNFT contract initialized at:", REWARDNFT_ADDRESS);
    return contract;
  } catch (error) {
    console.error("Error initializing RewardNFT contract:", error);
    throw error;
  }
}

// ✅ Get current account address
export async function getCurrentAddress() {
  try {
    const signer = await getSigner();
    return await signer.getAddress();
  } catch (error) {
    console.error("Error getting current address:", error);
    throw error;
  }
}

// ✅ Clear cached connection (useful for logout)
export function clearCachedConnection() {
  cachedProvider = null;
  cachedSigner = null;
  console.log("Cached connection cleared");
}
