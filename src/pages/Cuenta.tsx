import { User, Mail, Shield, Bell, Palette, Globe, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export default function Cuenta() {
  const { theme, setTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg");
  const [nombre, setNombre] = useState("Juan");
  const [apellido, setApellido] = useState("Pérez");
  const [email, setEmail] = useState("juan.perez@email.com");
  const [telefono, setTelefono] = useState("+54 11 1234-5678");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [transactionNotifications, setTransactionNotifications] = useState(false);
  const [idioma, setIdioma] = useState("es");
  const [moneda, setMoneda] = useState("USD");
  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast.success("Foto actualizada correctamente");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    toast.success("Cambios guardados correctamente");
  };

  const handlePasswordChange = () => {
    toast.info("Función de cambio de contraseña en desarrollo");
  };

  const handle2FA = () => {
    toast.info("Función de autenticación de dos factores en desarrollo");
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Mi Cuenta
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra tu perfil y preferencias de usuario
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tu información de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl">{nombre[0]}{apellido[0]}</AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Cambiar Foto
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG o GIF (máx. 2MB)
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input 
                  id="nombre" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input 
                  id="apellido" 
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input 
                id="telefono" 
                type="tel" 
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePasswordChange}>
                  Cambiar Contraseña
                </Button>
                <Button variant="outline" onClick={handle2FA}>
                  Configurar Autenticación de Dos Factores
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave}>Guardar Cambios</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Correo Electrónico</Label>
                  <p className="text-xs text-muted-foreground">
                    Recibir notificaciones por email
                  </p>
                </div>
                <Switch 
                  checked={emailNotifications}
                  onCheckedChange={(checked) => {
                    setEmailNotifications(checked);
                    toast.success(checked ? "Notificaciones activadas" : "Notificaciones desactivadas");
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas de Presupuesto</Label>
                  <p className="text-xs text-muted-foreground">
                    Avisos cuando excedas límites
                  </p>
                </div>
                <Switch 
                  checked={budgetAlerts}
                  onCheckedChange={(checked) => {
                    setBudgetAlerts(checked);
                    toast.success(checked ? "Alertas activadas" : "Alertas desactivadas");
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Transacciones</Label>
                  <p className="text-xs text-muted-foreground">
                    Notificar nuevas transacciones
                  </p>
                </div>
                <Switch 
                  checked={transactionNotifications}
                  onCheckedChange={(checked) => {
                    setTransactionNotifications(checked);
                    toast.success(checked ? "Notificaciones activadas" : "Notificaciones desactivadas");
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Oscuro</Label>
                  <p className="text-xs text-muted-foreground">
                    Tema oscuro para la interfaz
                  </p>
                </div>
                <Switch 
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => {
                    setTheme(checked ? "dark" : "light");
                    toast.success(checked ? "Modo oscuro activado" : "Modo claro activado");
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Región
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idioma">Idioma</Label>
                <Select 
                  value={idioma}
                  onValueChange={(value) => {
                    setIdioma(value);
                    toast.success("Idioma actualizado");
                  }}
                >
                  <SelectTrigger id="idioma">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="hi">हिन्दी</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moneda">Moneda Principal</Label>
                <Select 
                  value={moneda}
                  onValueChange={(value) => {
                    setMoneda(value);
                    toast.success("Moneda actualizada");
                  }}
                >
                  <SelectTrigger id="moneda">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólar Estadounidense ($)</SelectItem>
                    <SelectItem value="CAD">CAD - Dólar Canadiense ($)</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano ($)</SelectItem>
                    <SelectItem value="ARS">ARS - Peso Argentino ($)</SelectItem>
                    <SelectItem value="UYU">UYU - Peso Uruguayo ($U)</SelectItem>
                    <SelectItem value="BRL">BRL - Real Brasileño (R$)</SelectItem>
                    <SelectItem value="CLP">CLP - Peso Chileno ($)</SelectItem>
                    <SelectItem value="COP">COP - Peso Colombiano ($)</SelectItem>
                    <SelectItem value="PEN">PEN - Sol Peruano (S/)</SelectItem>
                    <SelectItem value="BOB">BOB - Boliviano (Bs.)</SelectItem>
                    <SelectItem value="PYG">PYG - Guaraní (₲)</SelectItem>
                    <SelectItem value="VES">VES - Bolívar (Bs.)</SelectItem>
                    <SelectItem value="DOP">DOP - Peso Dominicano (RD$)</SelectItem>
                    <SelectItem value="CRC">CRC - Colón Costarricense (₡)</SelectItem>
                    <SelectItem value="GTQ">GTQ - Quetzal (Q)</SelectItem>
                    <SelectItem value="HNL">HNL - Lempira (L)</SelectItem>
                    <SelectItem value="NIO">NIO - Córdoba (C$)</SelectItem>
                    <SelectItem value="PAB">PAB - Balboa (B/.)</SelectItem>
                    <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                    <SelectItem value="GBP">GBP - Libra Esterlina (£)</SelectItem>
                    <SelectItem value="JPY">JPY - Yen Japonés (¥)</SelectItem>
                    <SelectItem value="AUD">AUD - Dólar Australiano ($)</SelectItem>
                    <SelectItem value="CHF">CHF - Franco Suizo (Fr)</SelectItem>
                    <SelectItem value="CNY">CNY - Yuan Chino (¥)</SelectItem>
                    <SelectItem value="INR">INR - Rupia India (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Select 
                  value={timezone}
                  onValueChange={(value) => {
                    setTimezone(value);
                    toast.success("Zona horaria actualizada");
                  }}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">GMT-5 (Nueva York, EE.UU.)</SelectItem>
                    <SelectItem value="America/Chicago">GMT-6 (Chicago, EE.UU.)</SelectItem>
                    <SelectItem value="America/Los_Angeles">GMT-8 (Los Ángeles, EE.UU.)</SelectItem>
                    <SelectItem value="America/Denver">GMT-7 (Denver, EE.UU.)</SelectItem>
                    <SelectItem value="America/Phoenix">GMT-7 (Phoenix, EE.UU.)</SelectItem>
                    <SelectItem value="America/Anchorage">GMT-9 (Anchorage, EE.UU.)</SelectItem>
                    <SelectItem value="America/Toronto">GMT-5 (Toronto, Canadá)</SelectItem>
                    <SelectItem value="America/Vancouver">GMT-8 (Vancouver, Canadá)</SelectItem>
                    <SelectItem value="America/Edmonton">GMT-7 (Edmonton, Canadá)</SelectItem>
                    <SelectItem value="America/Montreal">GMT-5 (Montreal, Canadá)</SelectItem>
                    <SelectItem value="America/Halifax">GMT-4 (Halifax, Canadá)</SelectItem>
                    <SelectItem value="America/Mexico_City">GMT-6 (Ciudad de México)</SelectItem>
                    <SelectItem value="America/Monterrey">GMT-6 (Monterrey, México)</SelectItem>
                    <SelectItem value="America/Guadalajara">GMT-6 (Guadalajara, México)</SelectItem>
                    <SelectItem value="America/Cancun">GMT-5 (Cancún, México)</SelectItem>
                    <SelectItem value="America/Havana">GMT-5 (La Habana)</SelectItem>
                    <SelectItem value="America/Caracas">GMT-4 (Caracas)</SelectItem>
                    <SelectItem value="America/Bogota">GMT-5 (Bogotá)</SelectItem>
                    <SelectItem value="America/Lima">GMT-5 (Lima)</SelectItem>
                    <SelectItem value="America/Guayaquil">GMT-5 (Quito)</SelectItem>
                    <SelectItem value="America/La_Paz">GMT-4 (La Paz)</SelectItem>
                    <SelectItem value="America/Santiago">GMT-3 (Santiago)</SelectItem>
                    <SelectItem value="America/Argentina/Buenos_Aires">GMT-3 (Buenos Aires)</SelectItem>
                    <SelectItem value="America/Montevideo">GMT-3 (Montevideo)</SelectItem>
                    <SelectItem value="America/Asuncion">GMT-3 (Asunción)</SelectItem>
                    <SelectItem value="America/Sao_Paulo">GMT-3 (São Paulo, Brasil)</SelectItem>
                    <SelectItem value="America/Rio_de_Janeiro">GMT-3 (Río de Janeiro, Brasil)</SelectItem>
                    <SelectItem value="America/Brasilia">GMT-3 (Brasilia, Brasil)</SelectItem>
                    <SelectItem value="America/Manaus">GMT-4 (Manaus, Brasil)</SelectItem>
                    <SelectItem value="America/Panama">GMT-5 (Ciudad de Panamá)</SelectItem>
                    <SelectItem value="America/Costa_Rica">GMT-6 (San José)</SelectItem>
                    <SelectItem value="America/Managua">GMT-6 (Managua)</SelectItem>
                    <SelectItem value="America/Tegucigalpa">GMT-6 (Tegucigalpa)</SelectItem>
                    <SelectItem value="America/Guatemala">GMT-6 (Guatemala)</SelectItem>
                    <SelectItem value="America/Santo_Domingo">GMT-4 (Santo Domingo)</SelectItem>
                    <SelectItem value="Europe/London">GMT+0 (Londres, Reino Unido)</SelectItem>
                    <SelectItem value="Europe/Paris">GMT+1 (París, Francia)</SelectItem>
                    <SelectItem value="Europe/Berlin">GMT+1 (Berlín, Alemania)</SelectItem>
                    <SelectItem value="Europe/Madrid">GMT+1 (Madrid, España)</SelectItem>
                    <SelectItem value="Europe/Barcelona">GMT+1 (Barcelona, España)</SelectItem>
                    <SelectItem value="Europe/Rome">GMT+1 (Roma, Italia)</SelectItem>
                    <SelectItem value="Europe/Milan">GMT+1 (Milán, Italia)</SelectItem>
                    <SelectItem value="Europe/Amsterdam">GMT+1 (Ámsterdam, Países Bajos)</SelectItem>
                    <SelectItem value="Europe/Brussels">GMT+1 (Bruselas, Bélgica)</SelectItem>
                    <SelectItem value="Europe/Zurich">GMT+1 (Zúrich, Suiza)</SelectItem>
                    <SelectItem value="Europe/Vienna">GMT+1 (Viena, Austria)</SelectItem>
                    <SelectItem value="Europe/Lisbon">GMT+0 (Lisboa, Portugal)</SelectItem>
                    <SelectItem value="Europe/Moscow">GMT+3 (Moscú, Rusia)</SelectItem>
                    <SelectItem value="Europe/Istanbul">GMT+3 (Estambul, Turquía)</SelectItem>
                    <SelectItem value="Asia/Dubai">GMT+4 (Dubái, EAU)</SelectItem>
                    <SelectItem value="Asia/Riyadh">GMT+3 (Riad, Arabia Saudita)</SelectItem>
                    <SelectItem value="Asia/Tel_Aviv">GMT+2 (Tel Aviv, Israel)</SelectItem>
                    <SelectItem value="Asia/Kolkata">GMT+5:30 (Mumbai, India)</SelectItem>
                    <SelectItem value="Asia/Delhi">GMT+5:30 (Nueva Delhi, India)</SelectItem>
                    <SelectItem value="Asia/Bangkok">GMT+7 (Bangkok, Tailandia)</SelectItem>
                    <SelectItem value="Asia/Hong_Kong">GMT+8 (Hong Kong)</SelectItem>
                    <SelectItem value="Asia/Shanghai">GMT+8 (Shanghái, China)</SelectItem>
                    <SelectItem value="Asia/Beijing">GMT+8 (Pekín, China)</SelectItem>
                    <SelectItem value="Asia/Tokyo">GMT+9 (Tokio, Japón)</SelectItem>
                    <SelectItem value="Asia/Seoul">GMT+9 (Seúl, Corea del Sur)</SelectItem>
                    <SelectItem value="Asia/Singapore">GMT+8 (Singapur)</SelectItem>
                    <SelectItem value="Asia/Manila">GMT+8 (Manila, Filipinas)</SelectItem>
                    <SelectItem value="Australia/Sydney">GMT+11 (Sídney, Australia)</SelectItem>
                    <SelectItem value="Australia/Melbourne">GMT+11 (Melbourne, Australia)</SelectItem>
                    <SelectItem value="Australia/Brisbane">GMT+10 (Brisbane, Australia)</SelectItem>
                    <SelectItem value="Australia/Perth">GMT+8 (Perth, Australia)</SelectItem>
                    <SelectItem value="Pacific/Auckland">GMT+13 (Auckland, Nueva Zelanda)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
