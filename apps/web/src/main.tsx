/**
 * @nekolog/web - NekoLog Frontend
 *
 * React SPA for cat toilet tracking.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryProvider } from "./lib/query-client";
import App from "./App";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryProvider>
        <App />
      </QueryProvider>
    </ClerkProvider>
  </StrictMode>
);
