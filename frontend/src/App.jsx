import React, { useEffect } from "react";
import "./App.css";
import { io } from "socket.io-client";
import { Routes, Route } from 'react-router-dom'
import Login from "./pages/Login";

const socket = io();
console.log(socket);

function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("User Connected to WebSocket Server", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });
  }, []);

  return <div>
    <h1 className="text-2xl font-bold">Collaborative Dashboard</h1>
    <Routes>
      <Route path="/login" element={<Login/>}/>
    </Routes>
  </div>;
}

export default App;
