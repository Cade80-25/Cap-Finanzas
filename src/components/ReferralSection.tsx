import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, Copy, Check, Loader2, Users, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLicense } from "@/hooks/useLicense";

function getInstallationId(): string {
  const key = "cap-finanzas-installation-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REF-${code}`;
}

export function ReferralSection() {
  const { status, trialInfo } = useLicense();
  const [myCode, setMyCode] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [bonusDays, setBonusDays] = useState(0);
  const [hasRedeemed, setHasRedeemed] = useState(false);

  const installationId = getInstallationId();

  // Load or create referral code
  useEffect(() => {
    const stored = localStorage.getItem("cap-finanzas-referral-code");
    if (stored) {
      setMyCode(stored);
    }

    const storedBonus = parseInt(localStorage.getItem("cap-finanzas-referral-bonus") || "0");
    setBonusDays(storedBonus);

    const redeemed = localStorage.getItem("cap-finanzas-referral-redeemed") === "true";
    setHasRedeemed(redeemed);

    // Load referral count
    loadReferralCount();
  }, []);

  const loadReferralCount = async () => {
    const code = localStorage.getItem("cap-finanzas-referral-code");
    if (!code) return;

    try {
      const { count } = await (supabase as any)
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_code", code)
        .not("redeemed_at", "is", null);
      
      setReferralCount(count || 0);
      // Update bonus for referrer: 15 days per redemption
      const totalBonus = (count || 0) * 15;
      const ownRedeemBonus = parseInt(localStorage.getItem("cap-finanzas-referral-own-bonus") || "0");
      const total = totalBonus + ownRedeemBonus;
      setBonusDays(total);
      localStorage.setItem("cap-finanzas-referral-bonus", total.toString());
    } catch (err) {
      console.error("Error loading referral count:", err);
    }
  };

  const handleCreateCode = async () => {
    const code = generateReferralCode();
    
    try {
      const { error } = await supabase.from("referrals").insert({
        referrer_code: code,
        referrer_installation_id: installationId,
      } as any);

      if (error) {
        // Code collision, try again
        const code2 = generateReferralCode();
        await supabase.from("referrals").insert({
          referrer_code: code2,
          referrer_installation_id: installationId,
        } as any);
        setMyCode(code2);
        localStorage.setItem("cap-finanzas-referral-code", code2);
      } else {
        setMyCode(code);
        localStorage.setItem("cap-finanzas-referral-code", code);
      }
      toast.success("¡Código de referido creado!");
    } catch {
      toast.error("Error al crear código. Intenta de nuevo.");
    }
  };

  const handleCopy = () => {
    if (!myCode) return;
    const text = `¡Prueba Cap Finanzas gratis! Usa mi código de referido: ${myCode} y obtén 15 días extra de prueba. Descárgalo en: https://finanzas-divertidas-desktop.lovable.app`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("¡Mensaje copiado al portapapeles!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!myCode) return;
    const text = `¡Prueba Cap Finanzas gratis! Usa mi código de referido: ${myCode} y obtén 15 días extra de prueba.`;
    const url = "https://finanzas-divertidas-desktop.lovable.app";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Cap Finanzas", text, url });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setIsRedeeming(true);

    try {
      const { data, error } = await supabase.functions.invoke("redeem-referral", {
        body: {
          referralCode: redeemCode.trim().toUpperCase(),
          installationId,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        localStorage.setItem("cap-finanzas-referral-redeemed", "true");
        localStorage.setItem("cap-finanzas-referral-own-bonus", "15");
        setHasRedeemed(true);
        setBonusDays((prev) => prev + 15);
        localStorage.setItem("cap-finanzas-referral-bonus", (bonusDays + 15).toString());
        setRedeemCode("");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Error al canjear. Intenta de nuevo.");
    } finally {
      setIsRedeeming(false);
    }
  };

  // For active (paid) users — show sharing with account slot rewards
  if (status === "active") {
    return (
      <Card data-tutorial="referral-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Programa de Referidos
          </CardTitle>
          <CardDescription>
            Comparte y gana cuentas extra para tu aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Gift className="h-4 w-4" />
            <AlertDescription>
              Por cada persona que use tu código de referido, obtienes <strong>+1 cuenta extra</strong> (máximo 10 cuentas).
              Tu amigo recibe <strong>15 días extra</strong> de prueba gratis.
            </AlertDescription>
          </Alert>

          {myCode ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tu código de referido</Label>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-lg bg-muted px-3 py-2 rounded flex-1 text-center">{myCode}</code>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full" onClick={handleCreateCode}>
              <Gift className="h-4 w-4 mr-2" />
              Generar mi código de referido
            </Button>
          )}

          {referralCount > 0 && (
            <div className="bg-muted rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-primary" />
                {referralCount} persona{referralCount > 1 ? "s" : ""} usaron tu código
              </div>
              <p className="text-sm text-muted-foreground">
                Tienes <strong>{Math.min(5 + referralCount, 10)} cuentas</strong> disponibles
                {referralCount > 0 && <Badge variant="secondary" className="ml-2">+{Math.min(referralCount, 5)} extra</Badge>}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" />
          Programa de Referidos
        </CardTitle>
        <CardDescription>
          Comparte tu código y ambos reciben 15 días extra de prueba
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bonusDays > 0 && (
          <Alert>
            <Gift className="h-4 w-4" />
            <AlertDescription>
              ¡Tienes <strong>{bonusDays} días extra</strong> de prueba por referidos!
              {trialInfo.daysRemaining > 0 && (
                <span> Total restante: <strong>{trialInfo.daysRemaining + bonusDays} días</strong></span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* My referral code */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tu código de referido</Label>
          {myCode ? (
            <div className="flex items-center gap-2">
              <code className="font-mono font-bold text-lg bg-muted px-3 py-2 rounded flex-1 text-center">{myCode}</code>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button className="w-full" variant="outline" onClick={handleCreateCode}>
              <Gift className="h-4 w-4 mr-2" />
              Generar mi código de referido
            </Button>
          )}
          {referralCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{referralCount} persona{referralCount > 1 ? "s" : ""} usaron tu código</span>
              <Badge variant="secondary">+{referralCount * 15} días</Badge>
            </div>
          )}
        </div>

        {/* Redeem a code */}
        {!hasRedeemed && (
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm font-medium">¿Tienes un código de referido?</Label>
            <div className="flex gap-2">
              <Input
                placeholder="REF-XXXXXX"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                className="font-mono"
              />
              <Button onClick={handleRedeem} disabled={isRedeeming || !redeemCode.trim()}>
                {isRedeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Canjear"}
              </Button>
            </div>
          </div>
        )}

        {hasRedeemed && (
          <div className="border-t pt-3 text-sm text-muted-foreground flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            Ya canjeaste un código de referido (+15 días)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
