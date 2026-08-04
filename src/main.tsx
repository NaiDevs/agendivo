import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GlobalFeedback } from "@/components/global-feedback";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("No se encontró el elemento raíz de la aplicación.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
    <GlobalFeedback />
  </StrictMode>,
);
