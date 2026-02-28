/**
 * Root Application Component
 *
 * Entry point for the NekoLog React SPA.
 * Defines routing and layout structure.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/header";
import { ProtectedRoute } from "./lib/auth";
import { LoginPage } from "./pages/login";
import { CatsPage } from "./pages/cats";
import { LogsPage } from "./pages/logs";
import { HistoryPage } from "./pages/history";
import { DashboardPage } from "./pages/dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background text-foreground">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route index element={<DashboardPage />} />
                    <Route path="cats" element={<CatsPage />} />
                    <Route path="logs" element={<LogsPage />} />
                    <Route path="history" element={<HistoryPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
