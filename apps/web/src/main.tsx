/**
 * @nekolog/web - NekoLog Frontend
 *
 * React SPA for cat toilet tracking.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryProvider } from "./lib/query-client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>
);
