import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import "./styles/theme.css";
import { router } from "./app/router";
import { AuthProvider } from "./app/auth";
import { AppConfigProvider } from "./app/app-config";
import { SearchProvider } from "./app/search";
import { ToastProvider } from "./components/ui/toast";
import { PwaUpdatePrompt } from "./app/pwa-update";
import { initNative } from "./lib/native";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
});

// Tombol back Android (Capacitor): mundur bila ada riwayat; di root (home/welcome) keluar app.
const ROOTS = ["/", "/home", "/welcome", "/bookings", "/saved", "/inbox", "/account"];
initNative(() => {
  const path = router.state.location.pathname;
  if (ROOTS.includes(path) || window.history.length <= 1) return false;
  router.navigate(-1);
  return true;
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppConfigProvider>
          <AuthProvider>
            <SearchProvider>
              <RouterProvider router={router} />
              <PwaUpdatePrompt />
            </SearchProvider>
          </AuthProvider>
        </AppConfigProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
