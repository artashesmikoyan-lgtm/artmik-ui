import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../src/styles/tokens.css";
import "../src/styles/components.css";
import "./demo.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Demo root element #root was not found.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
