import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { StaysProvider } from "@/context/StaysContext";
import { AppLayout } from "@/components/layout/AppLayout";
import AuthPage from "@/components/AuthPage";
import HomePage from "@/pages/HomePage";
import StaysPage from "@/pages/StaysPage";
import ProfilePage from "@/pages/ProfilePage";
import "@/index.css";

function AppRoutes() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <StaysProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="stays" element={<StaysPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </StaysProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
