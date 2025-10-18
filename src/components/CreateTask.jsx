import React, { useState } from "react";
import { getTaskChainContract } from "../utils/provider";

export default function CreateTask({ onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  async function createTask() {
    if (!title.trim() || !desc.trim()) {
      alert("Title and Description are required");
      return;
    }

    try {
      setLoading(true);
      const contract = await getTaskChainContract();
      console.log("Creating task:", { title, desc });
      
      const tx = await contract.createTask(title.trim(), desc.trim());
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Transaction confirmed!");
      alert("Task created successfully!");

      // Clear inputs
      setTitle("");
      setDesc("");

      // Notify parent to refresh
      if (onTaskCreated) {
        onTaskCreated();
      }
      
    } catch (err) {
      console.error("createTask failed:", err);
      alert(`Error creating task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "5px" }}>
      <h3>Create New Task</h3>
      <div style={{ marginBottom: "1rem" }}>
        <input
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "0.5rem", 
            marginBottom: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "3px"
          }}
        />
        <input
          placeholder="Task Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "3px"
          }}
        />
      </div>
      <button 
        onClick={createTask} 
        disabled={loading || !title.trim() || !desc.trim()}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: loading ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "3px",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Creating Task..." : "Create Task"}
      </button>
    </div>
  );
}
