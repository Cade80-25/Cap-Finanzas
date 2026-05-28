// Shared brand tokens for Cap Finanzas auth emails
export const LOGO_URL =
  'https://pcxvnqsoafagnthazoir.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const BRAND = {
  primary: 'hsl(238, 55%, 52%)',
  primaryGlow: 'hsl(248, 52%, 62%)',
  heading: 'hsl(222, 20%, 18%)',
  muted: 'hsl(220, 10%, 44%)',
  mutedSoft: 'hsl(220, 10%, 56%)',
  surface: 'hsl(225, 20%, 97%)',
  border: 'hsl(220, 15%, 90%)',
}

export const styles = {
  main: {
    backgroundColor: '#f4f5fb',
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: '32px 12px',
  },
  card: {
    backgroundColor: '#ffffff',
    maxWidth: '560px',
    margin: '0 auto',
    borderRadius: '16px',
    overflow: 'hidden' as const,
    border: `1px solid ${BRAND.border}`,
    boxShadow: '0 8px 24px -12px rgba(60, 60, 120, 0.18)',
  },
  header: {
    background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryGlow} 100%)`,
    padding: '28px 28px 24px',
    textAlign: 'center' as const,
  },
  logo: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'block',
    margin: '0 auto 10px',
    backgroundColor: '#ffffff',
    padding: '6px',
  },
  brandName: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 700 as const,
    margin: 0,
    letterSpacing: '0.3px',
  },
  body: { padding: '32px 32px 8px' },
  h1: {
    fontSize: '22px',
    fontWeight: 700 as const,
    color: BRAND.heading,
    margin: '0 0 16px',
  },
  text: {
    fontSize: '15px',
    color: BRAND.muted,
    lineHeight: '1.6',
    margin: '0 0 18px',
  },
  link: { color: BRAND.primary, textDecoration: 'underline' },
  buttonWrap: { textAlign: 'center' as const, margin: '8px 0 24px' },
  button: {
    backgroundColor: BRAND.primary,
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700 as const,
    borderRadius: '12px',
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  codeBox: {
    backgroundColor: BRAND.surface,
    border: `1px solid ${BRAND.border}`,
    borderRadius: '12px',
    padding: '18px',
    textAlign: 'center' as const,
    margin: '8px 0 24px',
  },
  code: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '28px',
    fontWeight: 700 as const,
    color: BRAND.primary,
    letterSpacing: '6px',
    margin: 0,
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${BRAND.border}`,
    margin: '24px 0 16px',
  },
  footer: {
    padding: '0 32px 28px',
    fontSize: '12px',
    color: BRAND.mutedSoft,
    lineHeight: '1.6',
    textAlign: 'center' as const,
  },
}
