import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/design-system/s16-design-system-a395c6/design-system/styles/theme.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Application root element was not found.");
}

createRoot(root).render(<App />);
