/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { LOGO_URL, styles } from './_brand.ts'

interface Props { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ confirmationUrl }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Restablece tu contraseña de Cap Finanzas</Preview>
    <Body style={styles.main}>
      <Container style={styles.card}>
        <Section style={styles.header}>
          <Img src={LOGO_URL} alt="Cap Finanzas" style={styles.logo} />
          <Text style={styles.brandName}>Cap Finanzas</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>Restablece tu contraseña</Heading>
          <Text style={styles.text}>
            Recibimos una solicitud para restablecer tu contraseña.
            Haz clic en el botón para elegir una nueva.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={confirmationUrl}>Restablecer contraseña</Button>
          </Section>
          <Hr style={styles.divider} />
        </Section>
        <Text style={styles.footer}>
          Si no solicitaste este cambio, ignora este correo. Tu contraseña seguirá igual.<br />
          © Cap Finanzas
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
