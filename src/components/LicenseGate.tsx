// App is fully free — no license gate.
interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  return <>{children}</>;
}
