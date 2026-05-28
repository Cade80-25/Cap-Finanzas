/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { LOGO_URL, styles } from './_brand.ts'

interface Props {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteUrl, recipient, confirmationUrl }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma tu correo para Cap Finanzas</Preview>
    <Body style={styles.main}>
      <Container style={styles.card}>
        <Section style={styles.header}>
          <Img src={LOGO_URL} alt="Cap Finanzas" style={styles.logo} />
          <Text style={styles.brandName}>Cap Finanzas</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>Confirma tu correo</Heading>
          <Text style={styles.text}>
            ¡Gracias por unirte a{' '}
            <Link href={siteUrl} style={styles.link}><strong>Cap Finanzas</strong></Link>!
            Confirma que <strong>{recipient}</strong> es tu correo para activar tu cuenta.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={confirmationUrl}>Verificar correo</Button>
          </Section>
          <Hr style={styles.divider} />
        </Section>
        <Text style={styles.footer}>
          Si no creaste una cuenta, puedes ignorar este mensaje.<br />
          © Cap Finanzas — Tu dinero, claro y bajo control.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
