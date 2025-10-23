import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LibroDiario from "./pages/LibroDiario";
import LibroMayor from "./pages/LibroMayor";
import Balance from "./pages/Balance";
import EstadoResultados from "./pages/EstadoResultados";
import Enciclopedia from "./pages/Enciclopedia";
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
            <Route path="libro-diario" element={<LibroDiario />} />
            <Route path="libro-mayor" element={<LibroMayor />} />
            <Route path="balance" element={<Balance />} />
            <Route path="resultados" element={<EstadoResultados />} />
            <Route path="enciclopedia" element={<Enciclopedia />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
