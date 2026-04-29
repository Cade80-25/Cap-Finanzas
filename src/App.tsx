import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Transacciones from "./pages/Transacciones";
import Calendario from "./pages/Calendario";
import Presupuesto from "./pages/Presupuesto";
import Monedas from "./pages/Monedas";
import Categorias from "./pages/Categorias";
import Resumen from "./pages/Resumen";
import Contabilidad from "./pages/Contabilidad";
import Aprender from "./pages/Aprender";
import Ajustes from "./pages/Ajustes";
import Notificaciones from "./pages/Notificaciones";
import NotFound from "./pages/NotFound";
import Instalar from "./pages/Instalar";
import LandingPage from "./pages/LandingPage";
import LicenseGenerator from "./pages/LicenseGenerator";
import Admin from "./pages/Admin";
import Privacidad from "./pages/Privacidad";
import Terminos from "./pages/Terminos";
import { ThemeProvider } from "next-themes";
import { useNotificationGenerator } from "./hooks/useNotificationGenerator";
import { WalletProvider } from "./contexts/WalletContext";

const queryClient = new QueryClient();

const isElectron =
  typeof window !== "undefined" &&
  typeof (window as any).electron !== "undefined";

const isFileProtocol =
  typeof window !== "undefined" && window.location?.protocol === "file:";

const Router = isElectron || isFileProtocol ? HashRouter : BrowserRouter;

// Componente para activar el generador de notificaciones
function NotificationProvider({ children }: { children: React.ReactNode }) {
  useNotificationGenerator();
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <WalletProvider>
        <NotificationProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              {/* Landing page y rutas públicas */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/admin" element={<Admin />} />
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
          </Router>
        </NotificationProvider>
        </WalletProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
