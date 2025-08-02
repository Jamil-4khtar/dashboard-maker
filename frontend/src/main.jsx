import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthProvider.jsx";
import { BrowserRouter } from "react-router-dom";
import DashboardProvider from "./contexts/dashboardProvider.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <DashboardProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DashboardProvider>
  </AuthProvider>
);
