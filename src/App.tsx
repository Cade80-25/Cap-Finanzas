import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transacciones" element={<Transacciones />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="presupuesto" element={<Presupuesto />} />
            <Route path="monedas" element={<Monedas />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="resumen" element={<Resumen />} />
            <Route path="libro-diario" element={<LibroDiario />} />
            <Route path="libro-mayor" element={<LibroMayor />} />
            <Route path="balance" element={<Balance />} />
            <Route path="resultados" element={<EstadoResultados />} />
            <Route path="enciclopedia" element={<Enciclopedia />} />
            <Route path="cuenta" element={<Cuenta />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
