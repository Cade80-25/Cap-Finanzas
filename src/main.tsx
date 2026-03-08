import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore dim theme on load
const savedVariant = localStorage.getItem("cap-finanzas-theme-variant");
if (savedVariant === "dim") {
  document.documentElement.setAttribute("data-theme", "dim");
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
