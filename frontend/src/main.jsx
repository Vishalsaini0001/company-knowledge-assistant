import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#111e30",
            color: "#eef4ff",
            border: "1px solid #1e2f4a",
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#111e30" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#111e30" } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
