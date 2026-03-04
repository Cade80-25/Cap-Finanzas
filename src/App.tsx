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
import LibroDiario from "./pages/LibroDiario";
import LibroMayor from "./pages/LibroMayor";
import Balance from "./pages/Balance";
import EstadoResultados from "./pages/EstadoResultados";
import Enciclopedia from "./pages/Enciclopedia";
import Cuenta from "./pages/Cuenta";
import Configuracion from "./pages/Configuracion";
import Recomendaciones from "./pages/Recomendaciones";
import Notificaciones from "./pages/Notificaciones";
import Manual from "./pages/Manual";
import NotFound from "./pages/NotFound";
import Instalar from "./pages/Instalar";
import LandingPage from "./pages/LandingPage";
import LicenseGenerator from "./pages/LicenseGenerator";
import Admin from "./pages/Admin";
import Consolidado from "./pages/Consolidado";
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
                <Route path="consolidado" element={<Consolidado />} />
                <Route path="libro-diario" element={<LibroDiario />} />
                <Route path="libro-mayor" element={<LibroMayor />} />
                <Route path="balance" element={<Balance />} />
                <Route path="resultados" element={<EstadoResultados />} />
                <Route path="enciclopedia" element={<Enciclopedia />} />
                <Route path="recomendaciones" element={<Recomendaciones />} />
                <Route path="notificaciones" element={<Notificaciones />} />
                <Route path="manual" element={<Manual />} />
                <Route path="cuenta" element={<Cuenta />} />
                <Route path="configuracion" element={<Configuracion />} />
                <Route path="instalar" element={<Instalar />} />
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
