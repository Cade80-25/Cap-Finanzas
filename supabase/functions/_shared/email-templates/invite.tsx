/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { LOGO_URL, styles } from './_brand.ts'

interface Props { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ siteUrl, confirmationUrl }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Te invitaron a Cap Finanzas</Preview>
    <Body style={styles.main}>
      <Container style={styles.card}>
        <Section style={styles.header}>
          <Img src={LOGO_URL} alt="Cap Finanzas" style={styles.logo} />
          <Text style={styles.brandName}>Cap Finanzas</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>Te invitaron a unirte</Heading>
          <Text style={styles.text}>
            Te invitaron a unirte a{' '}
            <Link href={siteUrl} style={styles.link}><strong>Cap Finanzas</strong></Link>.
            Acepta la invitación para crear tu cuenta y empezar.
          </Text>
          <Section style={styles.buttonWrap}>
            <Button style={styles.button} href={confirmationUrl}>Aceptar invitación</Button>
          </Section>
          <Hr style={styles.divider} />
        </Section>
        <Text style={styles.footer}>
          Si no esperabas esta invitación, puedes ignorar este correo.<br />
          © Cap Finanzas
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
