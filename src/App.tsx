import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import { ThemeProvider } from "next-themes";
import { useNotificationGenerator } from "./hooks/useNotificationGenerator";
import { usePurchaseIssueNotifications } from "./hooks/usePurchaseIssueNotifications";
import { WalletProvider } from "./contexts/WalletContext";

// Code-split: páginas cargadas bajo demanda para acelerar la primera carga
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transacciones = lazy(() => import("./pages/Transacciones"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Presupuesto = lazy(() => import("./pages/Presupuesto"));
const Monedas = lazy(() => import("./pages/Monedas"));
const Categorias = lazy(() => import("./pages/Categorias"));
const Resumen = lazy(() => import("./pages/Resumen"));
const Contabilidad = lazy(() => import("./pages/Contabilidad"));
const Aprender = lazy(() => import("./pages/Aprender"));
const Ajustes = lazy(() => import("./pages/Ajustes"));
const Notificaciones = lazy(() => import("./pages/Notificaciones"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Instalar = lazy(() => import("./pages/Instalar"));
const LicenseGenerator = lazy(() => import("./pages/LicenseGenerator"));
const Admin = lazy(() => import("./pages/Admin"));
const Privacidad = lazy(() => import("./pages/Privacidad"));
const Terminos = lazy(() => import("./pages/Terminos"));
const PaddleStatus = lazy(() => import("./pages/PaddleStatus"));

const queryClient = new QueryClient();

const isElectron =
  typeof window !== "undefined" &&
  typeof (window as any).electron !== "undefined";

const isFileProtocol =
  typeof window !== "undefined" && window.location?.protocol === "file:";

const Router = isElectron || isFileProtocol ? HashRouter : BrowserRouter;

function NotificationProvider({ children }: { children: React.ReactNode }) {
  useNotificationGenerator();
  usePurchaseIssueNotifications();
  return <>{children}</>;
}
}

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
    Cargando…
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <WalletProvider>
        <NotificationProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Landing page y rutas públicas */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/privacidad" element={<Privacidad />} />
                <Route path="/terminos" element={<Terminos />} />
                <Route path="/license-generator" element={<LicenseGenerator />} />
                <Route path="/paddle-status" element={<PaddleStatus />} />
                <Route path="/license-generator" element={<LicenseGenerator />} />

                {/* App principal */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="transacciones" element={<Transacciones />} />
                  <Route path="calendario" element={<Calendario />} />
                  <Route path="presupuesto" element={<Presupuesto />} />
                  <Route path="monedas" element={<Monedas />} />
                  <Route path="categorias" element={<Categorias />} />
                  <Route path="resumen" element={<Resumen />} />
                  <Route path="contabilidad" element={<Contabilidad />} />
                  <Route path="aprender" element={<Aprender />} />
                  <Route path="notificaciones" element={<Notificaciones />} />
                  <Route path="ajustes" element={<Ajustes />} />
                  <Route path="instalar" element={<Instalar />} />
                  {/* Redirecciones legacy: rutas antiguas → nuevas agrupadas */}
                  <Route path="consolidado" element={<Resumen />} />
                  <Route path="libro-diario" element={<Contabilidad />} />
                  <Route path="libro-mayor" element={<Contabilidad />} />
                  <Route path="balance" element={<Contabilidad />} />
                  <Route path="resultados" element={<Contabilidad />} />
                  <Route path="enciclopedia" element={<Aprender />} />
                  <Route path="recomendaciones" element={<Aprender />} />
                  <Route path="manual" element={<Aprender />} />
                  <Route path="cuenta" element={<Ajustes />} />
                  <Route path="configuracion" element={<Ajustes />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </NotificationProvider>
        </WalletProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
