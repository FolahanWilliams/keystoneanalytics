import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals, initErrorTracking } from "./utils/monitoring";

// Initialize monitoring
initErrorTracking();
initWebVitals();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
