import { Toaster } from "@/components/ui/toaster";
import { PlanGuard } from "@/components/PlanGuard";
import Bolsas from "@/pages/Bolsas";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import { ThemeProvider } from "next-themes";
import { useNotificationGenerator } from "./hooks/useNotificationGenerator";
import { usePurchaseIssueNotifications } from "./hooks/usePurchaseIssueNotifications";
import { useTrialExpiryReminder } from "./hooks/useTrialExpiryReminder";
import { WalletProvider } from "./contexts/WalletContext";
import { DemoModeBanner } from "./components/DemoModeBanner";
import { prefetchHotModules } from "./lib/prefetch-hot-modules";

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
const Comparativa = lazy(() => import("./pages/Comparativa"));
const Articulo = lazy(() => import("./pages/Articulo"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CuentasCorrientes = lazy(() => import("./pages/CuentasCorrientes"));
const Facturacion = lazy(() => import("./pages/Facturacion"));
const RRHH = lazy(() => import("./pages/RRHH"));
const Fabricacion = lazy(() => import("./pages/Fabricacion"));
const Activos = lazy(() => import("./pages/Activos"));
const Inventario = lazy(() => import("./pages/Inventario"));
const Banca = lazy(() => import("./pages/Banca"));
const Proyectos = lazy(() => import("./pages/Proyectos"));
const ContabilidadAnalitica = lazy(() => import("./pages/ContabilidadAnalitica"));
const Tesoreria = lazy(() => import("./pages/Tesoreria"));
const Inmobiliaria = lazy(() => import("./pages/Inmobiliaria"));
const AnalisisFinanciero = lazy(() => import("./pages/AnalisisFinanciero"));
const TradingJournal = lazy(() => import("./pages/TradingJournal"));
const Gastos = lazy(() => import("./pages/Gastos"));
const Contratos = lazy(() => import("./pages/Contratos"));
const Calidad = lazy(() => import("./pages/Calidad"));
const Mantenimiento = lazy(() => import("./pages/Mantenimiento"));
const Flota = lazy(() => import("./pages/Flota"));
const Alquiler = lazy(() => import("./pages/Alquiler"));
const Seguros = lazy(() => import("./pages/Seguros"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const Aprobaciones = lazy(() => import("./pages/Aprobaciones"));

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
  useTrialExpiryReminder();
  useEffect(() => {
    // Precalienta las rutas más usadas en idle para reducir TTI percibido.
    prefetchHotModules();
  }, []);
  return <>{children}</>;
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
                <Route path="/comparativa" element={<Comparativa />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/privacidad" element={<Privacidad />} />
                <Route path="/terminos" element={<Terminos />} />
                <Route path="/license-generator" element={<LicenseGenerator />} />
                <Route path="/paddle-status" element={<PaddleStatus />} />

                {/* App principal */}
                <Route
                  path="/"
                  element={<><DemoModeBanner /><Layout /></>}
                >
                  <Route path="aprender/articulos/:slug" element={<Articulo />} />
                  <Route index element={<Dashboard />} />
                  <Route path="transacciones" element={<Transacciones />} />
                  <Route path="calendario" element={<Calendario />} />
                  <Route path="presupuesto" element={<Presupuesto />} />
                  <Route path="monedas" element={<Monedas />} />
                  <Route path="categorias" element={<PlanGuard feature="categories"><Categorias /></PlanGuard>} />
                  <Route path="resumen" element={<Resumen />} />
                  <Route path="contabilidad" element={<PlanGuard feature="accounting"><Contabilidad /></PlanGuard>} />
                  <Route path="cuentas-corrientes" element={<PlanGuard feature="cuentasCorrientes"><CuentasCorrientes /></PlanGuard>} />
                  <Route path="facturacion" element={<PlanGuard feature="facturacion"><Facturacion /></PlanGuard>} />
                  <Route path="rrhh" element={<PlanGuard feature="rrhh"><RRHH /></PlanGuard>} />
                  <Route path="fabricacion" element={<PlanGuard feature="fabricacion"><Fabricacion /></PlanGuard>} />
                  <Route path="activos" element={<PlanGuard feature="activos"><Activos /></PlanGuard>} />
                  <Route path="inventario" element={<PlanGuard feature="inventario"><Inventario /></PlanGuard>} />
                  <Route path="banca" element={<PlanGuard feature="banca"><Banca /></PlanGuard>} />
                  <Route path="proyectos" element={<PlanGuard feature="proyectos"><Proyectos /></PlanGuard>} />
                  <Route path="analitica" element={<PlanGuard feature="analitica"><ContabilidadAnalitica /></PlanGuard>} />
                  <Route path="tesoreria" element={<PlanGuard feature="tesoreria"><Tesoreria /></PlanGuard>} />
                  <Route path="inmobiliaria" element={<PlanGuard feature="inmobiliaria"><Inmobiliaria /></PlanGuard>} />
                  <Route path="analisis" element={<PlanGuard feature="analisis"><AnalisisFinanciero /></PlanGuard>} />
                  <Route path="trading" element={<PlanGuard feature="trading"><TradingJournal /></PlanGuard>} />
                  <Route path="gastos" element={<PlanGuard feature="gastos"><Gastos /></PlanGuard>} />
                  <Route path="contratos" element={<PlanGuard feature="contratos"><Contratos /></PlanGuard>} />
                  <Route path="calidad" element={<PlanGuard feature="calidad"><Calidad /></PlanGuard>} />
                  <Route path="mantenimiento" element={<PlanGuard feature="mantenimiento"><Mantenimiento /></PlanGuard>} />
                  <Route path="flota" element={<PlanGuard feature="flota"><Flota /></PlanGuard>} />
                  <Route path="alquiler" element={<PlanGuard feature="alquiler"><Alquiler /></PlanGuard>} />
                  <Route path="seguros" element={<PlanGuard feature="seguros"><Seguros /></PlanGuard>} />
                  <Route path="auditoria" element={<PlanGuard feature="auditoria"><Auditoria /></PlanGuard>} />
                  <Route path="aprobaciones" element={<PlanGuard feature="aprobaciones"><Aprobaciones /></PlanGuard>} />
                  <Route path="bolsas" element={<PlanGuard feature="markets"><Bolsas /></PlanGuard>} />
                  <Route path="aprender" element={<Aprender />} />
                  <Route path="notificaciones" element={<Notificaciones />} />
                  <Route path="ajustes" element={<Ajustes />} />
                  <Route path="instalar" element={<Instalar />} />
                  {/* Redirecciones legacy: rutas antiguas → nuevas agrupadas */}
                  <Route path="consolidado" element={<PlanGuard feature="consolidated"><Resumen /></PlanGuard>} />
                  <Route path="libro-diario" element={<PlanGuard feature="journal"><Contabilidad /></PlanGuard>} />
                  <Route path="libro-mayor" element={<PlanGuard feature="ledger"><Contabilidad /></PlanGuard>} />
                  <Route path="balance" element={<PlanGuard feature="balance"><Contabilidad /></PlanGuard>} />
                  <Route path="resultados" element={<PlanGuard feature="incomeStatement"><Contabilidad /></PlanGuard>} />
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
