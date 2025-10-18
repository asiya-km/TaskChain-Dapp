import { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { getRewardNFTContract, getTaskChainContract } from "../utils/provider";

export default function ProgressTracker() {
  const { walletConnected, account } = useWallet();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  const tiers = [
    { threshold: 1, name: "Bronze Tasker", color: "#cd7f32", description: "First Task Completed" },
    { threshold: 3, name: "Silver Achiever", color: "#c0c0c0", description: "3 Tasks Completed" },
    { threshold: 5, name: "Gold Master", color: "#ffd700", description: "5 Tasks Completed" },
    { threshold: 10, name: "Platinum Legend", color: "#e5e4e2", description: "10 Tasks Completed" },
    { threshold: 25, name: "Diamond Elite", color: "#b9f2ff", description: "25 Tasks Completed" }
  ];

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
        debugText += "1. taskChain.setRewardNFTAddress('REWARD_NFT_ADDRESS')\n";
        debugText += "2. rewardNFT.setTaskChainAddress('TASK_CHAIN_ADDRESS')\n";
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

  // ✅ Fixed: Manual tier check
  const manualCheckTiers = async () => {
    try {
      setLoading(true);
      console.log("Manually checking tiers...");
      const nftContract = await getRewardNFTContract();
      
      const tx = await nftContract.checkTiers(account);
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Tiers checked successfully!");
      
      loadProgress();
      alert("Tiers checked! If you qualified for any NFTs, they should appear soon.");
    } catch (error) {
      console.error("Error manually checking tiers:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed: Load progress with proper type conversion
  const loadProgress = async () => {
    if (!walletConnected || !account) return;

    try {
      setLoading(true);
      
      // Try to get progress from both contracts
      const taskContract = await getTaskChainContract();
      const completedCount = await taskContract.getCompletedTaskCount(account);
      
      // ✅ FIXED: Use parseInt instead of toNumber()
      const taskCount = parseInt(completedCount.toString());
      
      const tierStatuses = tiers.map(tier => taskCount >= tier.threshold);
      const highestTier = calculateTier(taskCount);

      setProgress({
        taskCount,
        highestTier,
        tierStatuses,
        nextTierThreshold: getNextTierThreshold(taskCount)
      });
      
    } catch (error) {
      console.error("Error loading progress:", error);
      // Fallback to manual counting
      await loadManualProgress();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Added missing function
  const loadManualProgress = async () => {
    try {
      const contract = await getTaskChainContract();
      const nextId = await contract.nextId();
      let completedCount = 0;

      for (let i = 0; i < parseInt(nextId.toString()); i++) {
        try {
          const task = await contract.getTask(i);
          // Handle different task data structures
          let taskDone = false;
          let taskOwner = '';
          
          if (typeof task.done === 'boolean') {
            taskDone = task.done;
            taskOwner = task.owner;
          } else if (Array.isArray(task)) {
            taskDone = task[4];
            taskOwner = task[3];
          }
          
          if (taskDone && taskOwner?.toLowerCase() === account?.toLowerCase()) {
            completedCount++;
          }
        } catch (e) {
          break;
        }
      }

      const tierStatuses = tiers.map(tier => completedCount >= tier.threshold);
      const highestTier = calculateTier(completedCount);

      setProgress({
        taskCount: completedCount,
        highestTier,
        tierStatuses,
        nextTierThreshold: getNextTierThreshold(completedCount)
      });
    } catch (error) {
      console.error("Error counting tasks manually:", error);
    }
  };

  const calculateTier = (count) => {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (count >= tiers[i].threshold) return i;
    }
    return -1;
  };

  const getNextTierThreshold = (currentCount) => {
    for (let i = 0; i < tiers.length; i++) {
      if (currentCount < tiers[i].threshold) {
        return tiers[i].threshold;
      }
    }
    return tiers[tiers.length - 1].threshold + 5;
  };

  useEffect(() => {
    loadProgress();
  }, [walletConnected, account]);

  if (!walletConnected || !progress) return null;

  return (
    <div style={{ 
      border: "2px solid #e0e0e0", 
      padding: "1.5rem", 
      borderRadius: "10px",
      marginBottom: "2rem",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>🎯 Achievement Progress</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={checkContractConnection} style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>
            Check Connection
          </button>
          <button onClick={manualCheckTiers} disabled={loading} style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>
            {loading ? "Checking..." : "Check Tiers"}
          </button>
        </div>
      </div>

      {/* Progress display */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 0.5rem 0" }}>
            {progress.taskCount} Task{progress.taskCount !== 1 ? 's' : ''} Completed
          </h4>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "10px", height: "20px", overflow: "hidden" }}>
            <div style={{
              background: "linear-gradient(90deg, #ff6b6b, #ffd93d)",
              width: `${Math.min(100, (progress.taskCount / 25) * 100)}%`,
              height: "100%",
              transition: "width 0.5s ease",
              borderRadius: "10px"
            }}></div>
          </div>
        </div>
        {progress.highestTier >= 0 && (
          <div style={{ 
            marginLeft: "1rem", 
            padding: "0.5rem 1rem",
            background: tiers[progress.highestTier].color,
            borderRadius: "20px",
            fontWeight: "bold"
          }}>
            {tiers[progress.highestTier].name}
          </div>
        )}
      </div>

      {/* Tier progress */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "1rem" }}>
        {tiers.map((tier, index) => (
          <div key={index} style={{ textAlign: "center", flex: 1 }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: progress.tierStatuses[index] ? tier.color : "#ccc",
              margin: "0 auto 0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: progress.tierStatuses[index] ? "white" : "#666"
            }}>
              {progress.tierStatuses[index] ? "✓" : tier.threshold}
            </div>
            <small style={{ fontSize: "0.7rem" }}>
              {tier.name}
            </small>
          </div>
        ))}
      </div>

      {/* Debug info */}
      {debugInfo && (
        <div style={{ 
          background: "rgba(0,0,0,0.3)", 
          padding: "1rem", 
          borderRadius: "5px", 
          marginTop: "1rem",
          fontSize: "0.8rem",
          whiteSpace: "pre-wrap"
        }}>
          {debugInfo}
        </div>
      )}
    </div>
  );
}
