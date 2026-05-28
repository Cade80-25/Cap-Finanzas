/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Te invitaron a Cap Finanzas</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Te invitaron a unirte</Heading>
        <Text style={text}>
          Te invitaron a unirte a{' '}
          <Link href={siteUrl} style={link}>
            <strong>Cap Finanzas</strong>
          </Link>
          . Haz clic en el botón para aceptar y crear tu cuenta.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Aceptar invitación
        </Button>
        <Text style={footer}>
          Si no esperabas esta invitación, puedes ignorar este correo.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(222, 20%, 18%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 44%)', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: 'hsl(238, 55%, 52%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(238, 55%, 52%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '12px 22px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(220, 10%, 56%)', margin: '28px 0 0' }
