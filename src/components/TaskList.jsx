import { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { getTaskChainContract } from "../utils/provider";

export default function TaskList({ refreshTrigger }) {
  const { walletConnected, account } = useWallet();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadTasks = async () => {
    console.log("loadTasks called", { walletConnected, account });
    
    if (!walletConnected) {
      console.log("Wallet not connected, skipping task load");
      setTasks([]);
      return;
    }

    try {
      setLoading(true);
      console.log("Loading tasks from blockchain...");
      
      const contract = await getTaskChainContract();
      const taskList = [];
      
      // Get the nextId to know how many tasks exist
      const nextId = await contract.nextId();
      const totalTasks = parseInt(nextId.toString());
      console.log(`Total tasks in contract: ${totalTasks}`);
      
      for (let id = 0; id < totalTasks; id++) {
        try {
          console.log(`Loading task ${id}...`);
          const task = await contract.getTask(id);
          console.log(`Task ${id} raw data:`, task);
          
          // Extract values from the Proxy/Result object
          let taskData;
          
          // Method 1: Try to access as array
          if (Array.isArray(task)) {
            taskData = task;
          } 
          // Method 2: Try to access properties directly
          else if (task.id !== undefined) {
            taskData = [task.id, task.title, task.description, task.owner, task.done];
          }
          // Method 3: Use toString and JSON parsing as last resort
          else {
            const taskString = task.toString();
            console.log(`Task ${id} as string:`, taskString);
            // If it's a string representation, try to parse it
            try {
              if (taskString.includes(',')) {
                taskData = taskString.split(',');
              }
            } catch (e) {
              console.log(`Could not parse task ${id} string`);
            }
          }
          
          if (taskData && taskData.length >= 5) {
            const taskId = taskData[0]?.toString() || id.toString();
            const title = taskData[1]?.toString() || '';
            const description = taskData[2]?.toString() || '';
            const owner = taskData[3]?.toString() || '';
            const done = Boolean(taskData[4]);
            
            console.log(`Task ${id} parsed:`, { taskId, title, description, owner, done });
            
            // Only add if it has content
            if (title || description) {
              taskList.push({
                id: taskId,
                title: title,
                desc: description,
                owner: owner,
                done: done,
                isOwner: owner.toLowerCase() === account?.toLowerCase()
              });
            }
          } else {
            console.log(`Task ${id} data structure unexpected:`, taskData);
          }
        } catch (error) {
          console.log(`Error loading task ${id}:`, error.message);
          // Continue to next task instead of breaking
        }
      }

      console.log(`Successfully loaded ${taskList.length} tasks`);
      setTasks(taskList);
    } catch (error) {
      console.error("Error loading tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Debug function to check contract state
  const debugContract = async () => {
    try {
      const contract = await getTaskChainContract();
      console.log("=== CONTRACT DEBUG INFO ===");
      
      // Check nextId
      const nextId = await contract.nextId();
      console.log("Next ID:", nextId.toString());
      
      // Check if tasks mapping works
      for (let i = 0; i < 5; i++) {
        try {
          const task = await contract.tasks(i);
          console.log(`Task ${i} from mapping:`, task);
        } catch (e) {
          console.log(`No task at mapping index ${i}`);
        }
      }
      
      console.log("=== END DEBUG ===");
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  // Call debug on mount
  useEffect(() => {
    debugContract();
  }, []);

  // ✅ Toggle Task Completion
  const toggleTaskCompletion = async (taskId) => {
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      const contract = await getTaskChainContract();
      console.log(`Toggling task ${taskId}...`);
      
      const tx = await contract.toggleDone(taskId);
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Task toggled successfully!");
      
      // Refresh tasks
      loadTasks();
      
      const task = tasks.find(t => t.id === taskId);
      alert(`Task "${task?.title}" ${!task?.done ? "completed" : "reopened"}! 🎉`);
    } catch (error) {
      console.error("Error toggling task:", error);
      if (error.message.includes("not owner")) {
        alert("You can only toggle tasks that you own!");
      } else {
        alert(`Error toggling task: ${error.message}`);
      }
    }
  };

  // ✅ Delete Task Function
  const deleteTask = async (taskId) => {
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }

    try {
      const contract = await getTaskChainContract();
      console.log(`Deleting task ${taskId}...`);
      
      const tx = await contract.deleteTask(taskId);
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Task deleted successfully!");
      
      // Refresh tasks
      loadTasks();
      
      alert("Task deleted successfully!");
    } catch (error) {
      console.error("Error deleting task:", error);
      
      if (error.message.includes("not owner")) {
        alert("You can only delete tasks that you own!");
      } else if (error.message.includes("cannot estimate gas") || error.message.includes("function does not exist")) {
        alert("Delete function not available in current contract.");
      } else {
        alert(`Error deleting task: ${error.message}`);
      }
    }
  };

  // ✅ Edit Task Functions
  const startEditing = (task) => {
    if (task.owner.toLowerCase() !== account?.toLowerCase()) {
      alert("You can only edit tasks that you own!");
      return;
    }
    
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditDescription(task.desc);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditTitle("");
    setEditDescription("");
  };

  const updateTask = async (taskId) => {
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!editTitle.trim()) {
      alert("Task title is required!");
      return;
    }

    try {
      const contract = await getTaskChainContract();
      console.log(`Updating task ${taskId}...`, { title: editTitle, description: editDescription });
      
      const tx = await contract.updateTask(taskId, editTitle, editDescription);
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Task updated successfully!");
      
      loadTasks();
      cancelEditing();
      alert("Task updated successfully!");
    } catch (error) {
      console.error("Error updating task:", error);
      
      if (error.message.includes("not owner")) {
        alert("You can only update tasks that you own!");
        cancelEditing();
      } else if (error.message.includes("cannot estimate gas") || error.message.includes("function does not exist")) {
        alert("Update function not available in current contract.");
      } else if (error.message.includes("cannot update completed task")) {
        alert("Cannot update completed tasks!");
        cancelEditing();
      } else {
        alert(`Error updating task: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    console.log("TaskList useEffect triggered", { walletConnected, refreshTrigger });
    loadTasks();

    let contract;
    const setupEventListener = async () => {
      if (!walletConnected) return;
      
      try {
        contract = await getTaskChainContract();
        contract.on("TaskCreated", loadTasks);
        contract.on("TaskToggled", loadTasks);
        
        try {
          contract.on("TaskUpdated", loadTasks);
        } catch (e) {}
        
        try {
          contract.on("TaskDeleted", loadTasks);
        } catch (e) {}
        
      } catch (error) {
        console.error("Error setting up event listener:", error);
      }
    };

    setupEventListener();

    return () => {
      if (contract) {
        contract.removeAllListeners("TaskCreated");
        contract.removeAllListeners("TaskToggled");
        try { contract.removeAllListeners("TaskUpdated"); } catch (e) {}
        try { contract.removeAllListeners("TaskDeleted"); } catch (e) {}
      }
    };
  }, [walletConnected, refreshTrigger, account]);

  if (!walletConnected) {
    return (
      <div>
        <h2>Tasks</h2>
        <p>Connect wallet to load tasks</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Tasks</h2>
      <button 
        onClick={debugContract}
        style={{
          padding: "0.3rem 0.6rem",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "3px",
          cursor: "pointer",
          marginBottom: "1rem",
          fontSize: "0.8rem"
        }}
      >
        Debug Contract
      </button>
      
      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div>
          <p>No tasks found.</p>
          <p><small>Create your first task above!</small></p>
        </div>
      ) : (
        <div>
          <p>Found {tasks.length} task(s)</p>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{ 
                border: "1px solid #ddd", 
                padding: "1rem", 
                marginBottom: "0.5rem",
                borderRadius: "5px",
                backgroundColor: task.done ? "#f0fff0" : "#fffaf0",
                borderLeft: task.isOwner ? "4px solid #007bff" : "4px solid #6c757d"
              }}
            >
              {editingTask === task.id ? (
                <div>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Task Title"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                      border: "1px solid #ccc",
                      borderRadius: "3px"
                    }}
                  />
                  <input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Task Description"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                      border: "1px solid #ccc",
                      borderRadius: "3px"
                    }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button 
                      onClick={() => updateTask(task.id)}
                      disabled={task.done}
                      style={{
                        padding: "0.3rem 0.6rem",
                        backgroundColor: task.done ? "#6c757d" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: task.done ? "not-allowed" : "pointer"
                      }}
                    >
                      {task.done ? "Cannot Edit Completed" : "Save"}
                    </button>
                    <button 
                      onClick={cancelEditing}
                      style={{
                        padding: "0.3rem 0.6rem",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  {task.done && (
                    <p style={{ color: "#dc3545", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                      Cannot edit completed tasks
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3 style={{ 
                      margin: "0 0 0.5rem 0",
                      textDecoration: task.done ? "line-through" : "none",
                      color: task.done ? "#666" : "inherit"
                    }}>
                      {task.title || "Untitled Task"}
                    </h3>
                    <div style={{ 
                      fontSize: "0.7rem", 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "12px",
                      backgroundColor: task.isOwner ? "#007bff" : "#6c757d",
                      color: "white"
                    }}>
                      {task.isOwner ? "Your Task" : "Other User"}
                    </div>
                  </div>
                  
                  <p style={{ 
                    margin: "0 0 0.5rem 0",
                    color: task.done ? "#666" : "inherit"
                  }}>
                    {task.desc || "No description"}
                  </p>
                  <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
                    <strong>Status:</strong> {task.done ? "✅ Completed" : "⏳ Pending"}
                  </p>
                  <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
                    <strong>Owner:</strong> {task.isOwner ? "You" : task.owner}
                  </p>
                  <small>Task ID: {task.id}</small>
                  
                  {task.isOwner && (
                    <div style={{ 
                      display: "flex", 
                      gap: "0.5rem", 
                      marginTop: "1rem",
                      flexWrap: "wrap"
                    }}>
                      <button 
                        onClick={() => toggleTaskCompletion(task.id)}
                        style={{
                          padding: "0.3rem 0.6rem",
                          backgroundColor: task.done ? "#6f42c1" : "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "0.8rem"
                        }}
                      >
                        {task.done ? "↶ Reopen" : "✅ Complete"}
                      </button>
                      
                      {!task.done && (
                        <button 
                          onClick={() => startEditing(task)}
                          style={{
                            padding: "0.3rem 0.6rem",
                            backgroundColor: "#ffc107",
                            color: "black",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "0.8rem"
                          }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                      
                      <button 
                        onClick={() => deleteTask(task.id)}
                        style={{
                          padding: "0.3rem 0.6rem",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "0.8rem"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
