import { useState } from "react";
import { useWallet } from "./contexts/WalletContext";
import TaskList from "./components/TaskList";
import NFTGallery from "./components/NFTGallery";
import CreateTask from "./components/CreateTask";
import ProgressTracker from "./components/ProgressTracker";

function App() {
  const { walletConnected, loading, account, connect } = useWallet();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTaskCreated = () => {
    console.log("Task created, triggering refresh...");
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>TaskChain DApp</h1>
        <p>Loading wallet...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ 
        textAlign: "center", 
        marginBottom: "2rem",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text"
      }}>
        TaskChain DApp 🚀
      </h1>

      {!walletConnected ? (
        <div style={{ 
          textAlign: "center", 
          padding: "3rem",
          border: "2px dashed #e0e0e0",
          borderRadius: "10px",
          background: "#f8f9fa"
        }}>
          <h2>Welcome to TaskChain! 🎯</h2>
          <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>
            Complete tasks, earn NFT rewards, and level up your productivity!
          </p>
          <button 
            onClick={connect}
            style={{
              padding: "0.8rem 2rem",
              fontSize: "1.1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Connect Wallet to Get Started
          </button>
          
          {/* Feature preview */}
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            gap: "2rem", 
            marginTop: "3rem",
            flexWrap: "wrap"
          }}>
            <div style={{ textAlign: "center", maxWidth: "200px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
              <h4>Task Management</h4>
              <p style={{ fontSize: "0.9rem", color: "#666" }}>Create and manage your tasks on blockchain</p>
            </div>
            <div style={{ textAlign: "center", maxWidth: "200px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏆</div>
              <h4>NFT Rewards</h4>
              <p style={{ fontSize: "0.9rem", color: "#666" }}>Earn unique NFTs for completing tasks</p>
            </div>
            <div style={{ textAlign: "center", maxWidth: "200px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📈</div>
              <h4>Progress Tracking</h4>
              <p style={{ fontSize: "0.9rem", color: "#666" }}>Level up through tiered achievement system</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "1.5rem",
            padding: "1rem",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e0e0e0"
          }}>
            <p style={{ 
              color: "green", 
              fontWeight: "bold", 
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span style={{ 
                display: "inline-block",
                width: "10px",
                height: "10px",
                backgroundColor: "green",
                borderRadius: "50%",
                animation: "pulse 2s infinite"
              }}></span>
              ✅ Wallet Connected: {account}
            </p>
            <small style={{ color: "#666" }}>
              Ready to earn rewards! 🎉
            </small>
          </div>
          
          {/* Progress Tracker - Shows user's achievement progress */}
          <ProgressTracker />
          
          {/* Create New Task */}
          <CreateTask onTaskCreated={handleTaskCreated} />
          
          {/* Task List */}
          <div style={{ margin: "2rem 0" }}>
            <TaskList refreshTrigger={refreshTrigger} />
          </div>
          
          {/* NFT Gallery */}
          <div style={{ margin: "2rem 0" }}>
            <NFTGallery refreshTrigger={refreshTrigger} />
          </div>
        </div>
      )}

      {/* Add some custom styles for the pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}

export default App;
