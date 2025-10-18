import { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { getRewardNFTContract, getTaskChainContract } from "../utils/provider";

export default function NFTGallery({ refreshTrigger }) {
  const { walletConnected, account } = useWallet();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // ✅ Fixed IPFS URL resolution
  function resolveIPFS(url) {
    if (!url || url === 'undefined') return "";
    console.log("Resolving IPFS URL:", url);
    
    // Handle URLs wrapped in < >
    if (url.startsWith("<") && url.endsWith(">")) {
      url = url.slice(1, -1);
    }
    
    // Handle complete IPFS URLs
    if (url.startsWith("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    
    // Handle IPFS hashes that are already just the hash (no protocol)
    if (url.startsWith("Qm") || url.startsWith("baf")) {
      return `https://ipfs.io/ipfs/${url}`;
    }
    
    // Handle HTTP URLs that might contain IPFS hashes
    if (url.startsWith("http")) {
      // If it's already an HTTP URL but contains < >, clean it
      if (url.includes('<') && url.includes('>')) {
        const hashMatch = url.match(/<([^>]+)>/);
        if (hashMatch && hashMatch[1]) {
          const cleanHash = hashMatch[1];
          if (cleanHash.startsWith('Qm') || cleanHash.startsWith('baf')) {
            return `https://ipfs.io/ipfs/${cleanHash}`;
          }
        }
      }
      return url;
    }
    
    console.warn("Unrecognized URL format:", url);
    return "";
  }

  // ✅ Fixed: Check contract connection
  const checkContractConnection = async () => {
    try {
      let debugText = "=== CONTRACT CONNECTION CHECK ===\n";
      
      const taskContract = await getTaskChainContract();
      const nftContract = await getRewardNFTContract();
      
      // Check TaskChain's RewardNFT address
      const rewardNFTAddress = await taskContract.rewardNFTAddress();
      debugText += `TaskChain RewardNFT address: ${rewardNFTAddress}\n`;
      
      // Check RewardNFT's TaskChain address  
      const taskChainAddress = await nftContract.taskChainAddress();
      debugText += `RewardNFT TaskChain address: ${taskChainAddress}\n`;
      
      // Check if they're properly connected
      const isConnected = rewardNFTAddress !== "0x0000000000000000000000000000000000000000" && 
                         taskChainAddress !== "0x0000000000000000000000000000000000000000";
      debugText += `Contracts connected: ${isConnected}\n`;
      
      if (!isConnected) {
        debugText += "❌ CONTRACTS NOT CONNECTED!\n";
        debugText += "Need to call:\n";
        debugText += "1. taskChain.setRewardNFTAddress('0xA4b8dA8E04228a580473a1f7575cbfB3C694f23c')\n";
        debugText += "2. rewardNFT.setTaskChainAddress('0x326e3077887A912eC4730b74719cDa1770bae3f8')\n";
      }
      
      debugText += "=== END CONNECTION CHECK ===";
      setDebugInfo(debugText);
      console.log(debugText);
      
      return isConnected;
    } catch (error) {
      const errorText = `Connection check error: ${error.message}`;
      setDebugInfo(errorText);
      console.error(errorText);
      return false;
    }
  };

  // ✅ Fixed: Load ONLY user's NFTs from the contract
  // ✅ Fixed: Load ONLY user's NFTs from the contract
async function loadNFTs() {
  if (!walletConnected || !account) {
    setNfts([]);
    return;
  }

  try {
    setLoading(true);
    console.log("Loading user's NFTs...");
    
    const nftContract = await getRewardNFTContract();
    
    // Method 1: Check all tokens and filter by owner (since no tokenOfOwnerByIndex)
    try {
      const totalSupply = await nftContract.tokenCounter();
      const totalSupplyNum = parseInt(totalSupply.toString());
      console.log(`Total NFTs in contract: ${totalSupplyNum}`);
      
      const nftList = [];

      for (let i = 0; i < totalSupplyNum; i++) {
        try {
          // Check if this token exists and is owned by user
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            console.log(`Found NFT ${i} owned by user`);
            
            const tokenURI = await nftContract.tokenURI(i);
            console.log(`NFT ${i} URI:`, tokenURI);
            
            const resolvedURI = resolveIPFS(tokenURI);
            console.log(`Fetching metadata from:`, resolvedURI);
            
            if (!resolvedURI) {
              console.warn(`No valid URI for NFT ${i}, skipping`);
              continue;
            }
            
            const response = await fetch(resolvedURI);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const metadata = await response.json();
            console.log(`NFT ${i} metadata:`, metadata);
            
            // Fix the image URL - handle the < > wrapping
            let imageUrl = metadata.image || "";
            
            // Clean the image URL from any < > wrappers
            if (imageUrl.startsWith("<") && imageUrl.endsWith(">")) {
              imageUrl = imageUrl.slice(1, -1);
            }
            
            let resolvedImage = resolveIPFS(imageUrl);
            
            // Fallback: if the resolved image still has issues, try to extract just the hash
            if (!resolvedImage || resolvedImage.includes('<')) {
              const hashMatch = metadata.image?.match(/baf[^<>]+|Qm[^<>]+/);
              if (hashMatch) {
                resolvedImage = `https://ipfs.io/ipfs/${hashMatch[0]}`;
                console.log(`Fallback image URL: ${resolvedImage}`);
              }
            }
            
            console.log(`Final resolved image URL:`, resolvedImage);
            
            nftList.push({
              id: i.toString(),
              name: metadata.name || `NFT #${i}`,
              description: metadata.description || "No description",
              image: resolvedImage,
              rawImage: metadata.image,
              tier: await getTierForToken(nftContract, i)
            });
          }
        } catch (error) {
          // Token might not exist or other error, continue to next
          console.log(`Token ${i} not owned by user or error:`, error.message);
        }
      }

      console.log(`Successfully loaded ${nftList.length} user NFTs`);
      setNfts(nftList);
      
    } catch (error) {
      console.log("Method 1 failed:", error);
      setNfts([]);
    }
    
  } catch (error) {
    console.error("Error loading NFTs:", error);
    setNfts([]);
  } finally {
    setLoading(false);
  }
};

  

  // Get tier information for a token
  async function getTierForToken(nftContract, tokenId) {
    try {
      // Try to get tier from contract mapping
      const tierIndex = await nftContract.tokenIdToTier(tokenId);
      return parseInt(tierIndex.toString());
    } catch (error) {
      console.log(`Could not get tier for token ${tokenId}:`, error.message);
      return 0;
    }
  }

  // ✅ Fixed: Debug function
  const debugNFTContract = async () => {
    try {
      const nftContract = await getRewardNFTContract();
      console.log("=== NFT CONTRACT DEBUG ===");
      
      // Check total supply - FIXED
      const totalSupply = await nftContract.tokenCounter();
      const totalSupplyNum = parseInt(totalSupply.toString());
      console.log("Total NFTs minted:", totalSupplyNum);
      
      // Check user's balance
      const balance = await nftContract.balanceOf(account);
      const balanceNum = parseInt(balance.toString());
      console.log("User NFT balance:", balanceNum);
      
      // Check contract connection
      await checkContractConnection();
      
      // If user has NFTs, show them
      if (balanceNum > 0) {
        console.log("User's NFTs:");
        for (let i = 0; i < balanceNum; i++) {
          try {
            const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
            console.log(`- Token ID: ${tokenId.toString()}`);
          } catch (error) {
            console.log(`Error getting token ${i}:`, error.message);
          }
        }
      } else {
        console.log("No NFTs owned by user");
      }
      
      console.log("=== END DEBUG ===");
    } catch (error) {
      console.error("NFT Debug error:", error);
    }
  };

  // Manual NFT minting test
  const testManualMint = async () => {
    try {
      console.log("=== MANUAL MINT TEST ===");
      
      const nftContract = await getRewardNFTContract();
      const taskContract = await getTaskChainContract();
      
      // Check current task count
      const completedCount = await taskContract.getCompletedTaskCount(account);
      console.log("Completed tasks:", completedCount.toString());
      
      // Manually trigger tier check
      console.log("Manually checking tiers...");
      const tx = await nftContract.checkTiers(account);
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Tier check completed!");
      
      // Reload NFTs
      loadNFTs();
      
    } catch (error) {
      console.error("Manual mint test error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    loadNFTs();

    let contract;
    const setupEventListener = async () => {
      if (!walletConnected) return;
      
      try {
        contract = await getRewardNFTContract();
        contract.on("Transfer", (from, to, tokenId) => {
          console.log(`NFT Transfer event: ${from} -> ${to}, tokenId: ${tokenId}`);
          if (to.toLowerCase() === account.toLowerCase()) {
            loadNFTs(); // Reload if user received an NFT
          }
        });
      } catch (error) {
        console.error("Error setting up NFT event listener:", error);
      }
    };

    setupEventListener();

    return () => {
      if (contract) {
        contract.removeAllListeners("Transfer");
      }
    };
  }, [walletConnected, refreshTrigger, account]);

  if (!walletConnected) {
    return (
      <div>
        <h2>My NFTs</h2>
        <p>Connect wallet to load NFTs</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>My NFTs</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            onClick={debugNFTContract}
            style={{
              padding: "0.3rem 0.6rem",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "0.8rem"
            }}
          >
            Debug NFTs
          </button>
          <button 
            onClick={checkContractConnection}
            style={{
              padding: "0.3rem 0.6rem",
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "0.8rem"
            }}
          >
            Check Connection
          </button>
          <button 
            onClick={testManualMint}
            style={{
              padding: "0.3rem 0.6rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "0.8rem"
            }}
          >
            Test Mint
          </button>
        </div>
      </div>
      
      {/* Debug info */}
      {debugInfo && (
        <div style={{ 
          background: "rgba(0,0,0,0.1)", 
          padding: "1rem", 
          borderRadius: "5px", 
          marginBottom: "1rem",
          fontSize: "0.8rem",
          whiteSpace: "pre-wrap",
          border: "1px solid #e0e0e0"
        }}>
          {debugInfo}
        </div>
      )}
      
      {loading ? (
        <p>Loading your NFTs...</p>
      ) : nfts.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "2rem",
          border: "2px dashed #e0e0e0",
          borderRadius: "10px",
          background: "#f8f9fa"
        }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>No NFTs yet.</p>
          <p><small>Complete tasks to earn NFT rewards! 🎯</small></p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
            <button 
              onClick={debugNFTContract}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Check NFT Status
            </button>
            <button 
              onClick={checkContractConnection}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Check Connection
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Found {nfts.length} NFT(s) in your collection</p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {nfts.map((nft) => (
              <div
                key={nft.id}
                style={{ 
                  border: "1px solid #ddd", 
                  padding: "1rem",
                  borderRadius: "5px",
                  maxWidth: "200px",
                  textAlign: "center",
                  backgroundColor: nft.error ? "#fff0f0" : "#f9f9f9",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
              >
                {nft.image ? (
                  <img 
                    src={nft.image} 
                    alt={nft.name}
                    style={{ 
                      width: "150px", 
                      height: "150px", 
                      objectFit: "cover",
                      borderRadius: "5px"
                    }}
                    onError={(e) => {
                      console.error(`Failed to load image for NFT ${nft.id}:`, nft.image);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null}
                
                {/* Fallback when image fails to load or doesn't exist */}
                {!nft.image && (
                  <div 
                    style={{ 
                      width: "150px", 
                      height: "150px", 
                      backgroundColor: "#f0f0f0",
                      borderRadius: "5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                      fontSize: "14px",
                      margin: "0 auto"
                    }}
                  >
                    {nft.error ? "Load Failed" : "No Image"}
                  </div>
                )}
                
                <h4 style={{ margin: "0.5rem 0" }}>{nft.name}</h4>
                <p style={{ fontSize: "0.9rem", margin: "0.5rem 0" }}>{nft.description}</p>
                <div style={{ 
                  fontSize: "0.8rem", 
                  color: "#666",
                  margin: "0.5rem 0"
                }}>
                  ID: {nft.id}
                  {nft.tier !== undefined && ` • Tier: ${nft.tier}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
