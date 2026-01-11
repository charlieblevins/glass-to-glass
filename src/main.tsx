import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { Dialog } from "@base-ui/react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Dialog.Root>
        <App />
      </Dialog.Root>
    </BrowserRouter>
  </StrictMode>
);
