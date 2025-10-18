import React from "react";
import CreateTask from "../components/CreateTask";
import TaskList from "../components/TaskList";
import NFTGallery from "../components/NFTGallery";

export default function Home() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>TaskChain DApp</h1>
      <CreateTask onTaskCreated={() => {}} />
      <TaskList />
      <NFTGallery />
    </div>
  );
}
