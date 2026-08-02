/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { LOGO_URL, styles } from './_brand.ts'

interface Props {
  siteName: string; oldEmail: string; email: string; newEmail: string; confirmationUrl: string
}

export const EmailChangeEmail = ({ oldEmail, newEmail, confirmationUrl }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma el cambio de correo de Cap Finanzas</Preview>
    <Body style={styles.main}>
      <Container style={styles.card}>
        <Section style={styles.header}>
          <Img src={LOGO_URL} alt="Cap Finanzas" style={styles.logo} />
          <Text style={styles.brandName}>Cap Finanzas</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>Confirma el cambio de correo</Heading>
          <Text style={styles.text}>
            Solicitaste cambiar el correo de tu cuenta de{' '}
            <Link href={`mailto:${oldEmail}`} style={styles.link}>{oldEmail}</Link>{' '}a{' '}
            <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={confirmationUrl}>Confirmar cambio</Button>
          </Section>
          <Hr style={styles.divider} />
        </Section>
        <Text style={styles.footer}>
          Si no solicitaste este cambio, asegura tu cuenta de inmediato.<br />
          © Cap Finanzas
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
