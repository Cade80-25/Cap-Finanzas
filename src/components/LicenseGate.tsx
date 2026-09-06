// LicenseGate — bloquea acceso si trial expirado
import { TrialExpiredModal } from "./TrialExpiredModal";

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  return <TrialExpiredModal>{children}</TrialExpiredModal>;
}
