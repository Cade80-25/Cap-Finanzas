// LicenseGate — bloquea acceso si trial expirado
import { TrialExpiredGate } from "./TrialExpiredModal";

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  return <TrialExpiredGate>{children}</TrialExpiredGate>;
}
