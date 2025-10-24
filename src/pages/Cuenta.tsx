import { User, Mail, Shield, Bell, Palette, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Cuenta() {
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
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-2xl">JD</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
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
                <Input id="nombre" defaultValue="Juan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" defaultValue="Pérez" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" defaultValue="juan.perez@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" type="tel" defaultValue="+54 11 1234-5678" />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </h3>
              <Button variant="outline">Cambiar Contraseña</Button>
              <Button variant="outline">Configurar Autenticación de Dos Factores</Button>
            </div>

            <div className="flex justify-end">
              <Button>Guardar Cambios</Button>
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
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas de Presupuesto</Label>
                  <p className="text-xs text-muted-foreground">
                    Avisos cuando excedas límites
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Transacciones</Label>
                  <p className="text-xs text-muted-foreground">
                    Notificar nuevas transacciones
                  </p>
                </div>
                <Switch />
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
                <Switch />
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
                <Select defaultValue="es">
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
                <Select defaultValue="USD">
                  <SelectTrigger id="moneda">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólar Estadounidense ($)</SelectItem>
                    <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                    <SelectItem value="GBP">GBP - Libra Esterlina (£)</SelectItem>
                    <SelectItem value="JPY">JPY - Yen Japonés (¥)</SelectItem>
                    <SelectItem value="ARS">ARS - Peso Argentino ($)</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano ($)</SelectItem>
                    <SelectItem value="BRL">BRL - Real Brasileño (R$)</SelectItem>
                    <SelectItem value="CAD">CAD - Dólar Canadiense ($)</SelectItem>
                    <SelectItem value="AUD">AUD - Dólar Australiano ($)</SelectItem>
                    <SelectItem value="CHF">CHF - Franco Suizo (Fr)</SelectItem>
                    <SelectItem value="CNY">CNY - Yuan Chino (¥)</SelectItem>
                    <SelectItem value="INR">INR - Rupia India (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Select defaultValue="America/Argentina/Buenos_Aires">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">GMT-5 (Nueva York)</SelectItem>
                    <SelectItem value="America/Chicago">GMT-6 (Chicago)</SelectItem>
                    <SelectItem value="America/Los_Angeles">GMT-8 (Los Ángeles)</SelectItem>
                    <SelectItem value="America/Mexico_City">GMT-6 (Ciudad de México)</SelectItem>
                    <SelectItem value="America/Argentina/Buenos_Aires">GMT-3 (Buenos Aires)</SelectItem>
                    <SelectItem value="America/Sao_Paulo">GMT-3 (São Paulo)</SelectItem>
                    <SelectItem value="America/Santiago">GMT-3 (Santiago)</SelectItem>
                    <SelectItem value="America/Bogota">GMT-5 (Bogotá)</SelectItem>
                    <SelectItem value="America/Lima">GMT-5 (Lima)</SelectItem>
                    <SelectItem value="Europe/London">GMT+0 (Londres)</SelectItem>
                    <SelectItem value="Europe/Paris">GMT+1 (París)</SelectItem>
                    <SelectItem value="Europe/Berlin">GMT+1 (Berlín)</SelectItem>
                    <SelectItem value="Europe/Madrid">GMT+1 (Madrid)</SelectItem>
                    <SelectItem value="Europe/Rome">GMT+1 (Roma)</SelectItem>
                    <SelectItem value="Europe/Moscow">GMT+3 (Moscú)</SelectItem>
                    <SelectItem value="Europe/Istanbul">GMT+3 (Estambul)</SelectItem>
                    <SelectItem value="Asia/Dubai">GMT+4 (Dubái)</SelectItem>
                    <SelectItem value="Asia/Kolkata">GMT+5:30 (Mumbai)</SelectItem>
                    <SelectItem value="Asia/Shanghai">GMT+8 (Shanghái)</SelectItem>
                    <SelectItem value="Asia/Tokyo">GMT+9 (Tokio)</SelectItem>
                    <SelectItem value="Asia/Seoul">GMT+9 (Seúl)</SelectItem>
                    <SelectItem value="Asia/Singapore">GMT+8 (Singapur)</SelectItem>
                    <SelectItem value="Australia/Sydney">GMT+11 (Sídney)</SelectItem>
                    <SelectItem value="Pacific/Auckland">GMT+13 (Auckland)</SelectItem>
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
