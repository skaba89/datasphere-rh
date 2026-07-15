/**
 * Système de notifications email pour DataSphere RH.
 *
 * En mode démo (pas de service email configuré) :
 * - Les emails sont loggés dans la console
 * - Les notifications sont créées en base (IN_APP)
 *
 * En production (avec Resend, SendGrid, etc.) :
 * - Les emails sont envoyés réellement
 * - Configurer EMAIL_FROM et EMAIL_API_KEY dans Netlify
 */

export interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Envoie un email.
 * En mode démo, log dans la console.
 * En production, utilise l'API configurée (Resend, SendGrid, etc.).
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string }> {
  const { to, subject, html, text } = params

  // Mode démo : pas de service email configuré
  if (!process.env.EMAIL_FROM || !process.env.EMAIL_API_KEY) {
    console.log('\n📧 [EMAIL - MODE DÉMO]')
    console.log(`   To: ${to}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Body: ${text || html.slice(0, 200)}...`)
    console.log('')
    return { success: true, messageId: `demo-${Date.now()}` }
  }

  // Mode production : envoyer via l'API
  try {
    // TODO: Intégrer Resend ou SendGrid
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: process.env.EMAIL_FROM,
    //     to,
    //     subject,
    //     html,
    //     text,
    //   }),
    // })
    // const data = await response.json()
    // return { success: true, messageId: data.id }

    console.log('[EMAIL] Service non configuré — email non envoyé')
    return { success: false }
  } catch (error) {
    console.error('sendEmail error:', error)
    return { success: false }
  }
}

// ━━━ Templates d'email ━━━

export function welcomeEmail(name: string, email: string): EmailParams {
  return {
    to: email,
    subject: 'Bienvenue sur DataSphere RH',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #27698a, #435862); padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="color: white; margin: 0;">DataSphere RH</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">SIRH Premium Guinée</p>
        </div>
        <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Bienvenue ${name} !</h2>
          <p style="color: #475569; line-height: 1.6;">
            Votre compte DataSphere RH a été créé avec succès. Vous pouvez maintenant
            accéder à la plateforme et gérer vos ressources humaines.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://gestion-sirh.netlify.app/" style="background: #27698a; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Accéder à la plateforme
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            Si vous avez des questions, contactez-nous : support@datasphere.gn
          </p>
        </div>
      </div>
    `,
    text: `Bienvenue ${name} ! Votre compte DataSphere RH a été créé. Accédez à la plateforme : https://gestion-sirh.netlify.app/`,
  }
}

export function leaveRequestEmail(
  employeeName: string,
  managerEmail: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  days: number
): EmailParams {
  return {
    to: managerEmail,
    subject: `Demande de congé - ${employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #27698a;">Nouvelle demande de congé</h2>
        <p><strong>Employé :</strong> ${employeeName}</p>
        <p><strong>Type :</strong> ${leaveType}</p>
        <p><strong>Période :</strong> ${startDate} au ${endDate} (${days} jour(s))</p>
        <div style="margin: 20px 0;">
          <a href="https://gestion-sirh.netlify.app/" style="background: #27698a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Voir et valider
          </a>
        </div>
      </div>
    `,
    text: `Demande de congé de ${employeeName} (${leaveType}) du ${startDate} au ${endDate} (${days} jours).`,
  }
}

export function payslipReadyEmail(
  employeeName: string,
  employeeEmail: string,
  month: string,
  netAmount: string
): EmailParams {
  return {
    to: employeeEmail,
    subject: `Bulletin de paie disponible - ${month}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #27698a;">Bulletin de paie - ${month}</h2>
        <p>Bonjour ${employeeName},</p>
        <p>Votre bulletin de paie pour ${month} est disponible.</p>
        <p><strong>Net à payer :</strong> ${netAmount}</p>
        <div style="margin: 20px 0;">
          <a href="https://gestion-sirh.netlify.app/" style="background: #27698a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Télécharger le bulletin
          </a>
        </div>
      </div>
    `,
    text: `Votre bulletin de paie ${month} est disponible. Net : ${netAmount}.`,
  }
}

export function passwordResetEmail(
  email: string,
  resetUrl: string
): EmailParams {
  return {
    to: email,
    subject: 'Réinitialisation de votre mot de passe - DataSphere RH',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #27698a;">Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
        <div style="margin: 20px 0;">
          <a href="${resetUrl}" style="background: #27698a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
    `,
    text: `Réinitialisez votre mot de passe : ${resetUrl}`,
  }
}
