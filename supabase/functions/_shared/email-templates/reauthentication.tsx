/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { LOGO_URL, styles } from './_brand.ts'

interface Props { token: string }

export const ReauthenticationEmail = ({ token }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación</Preview>
    <Body style={styles.main}>
      <Container style={styles.card}>
        <Section style={styles.header}>
          <Img src={LOGO_URL} alt="Cap Finanzas" style={styles.logo} />
          <Text style={styles.brandName}>Cap Finanzas</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>Confirma tu identidad</Heading>
          <Text style={styles.text}>Usa este código para confirmar tu identidad:</Text>
          <Section style={styles.codeBox}>
            <Text style={styles.code}>{token}</Text>
          </Section>
          <Hr style={styles.divider} />
        </Section>
        <Text style={styles.footer}>
          Este código expira pronto. Si no lo solicitaste, ignora este correo.<br />
          © Cap Finanzas
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
