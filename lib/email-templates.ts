/**
 * Szablony emaili dla platformy Pałka MTM
 * Professional HTML email templates with logo and branding
 */

interface EmailVerificationTemplateParams {
  verificationLink: string;
  userName?: string;
  logoUrl: string;
}

/**
 * Generuje HTML dla emaila weryfikacyjnego z logo i profesjonalnym designem
 */
export function generateEmailVerificationTemplate({
  verificationLink,
  userName,
  logoUrl,
}: EmailVerificationTemplateParams): string {
  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weryfikacja Email - Pałka MTM</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <img src="${logoUrl}" alt="Pałka MTM Logo" style="max-width: 180px; height: auto; margin-bottom: 20px;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Weryfikacja Adresu Email</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${userName ? `<p style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0;">Witaj, <strong>${userName}</strong>!</p>` : ''}
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dziękujemy za rejestrację na platformie <strong>Pałka MTM</strong> – Twojego miejsca w świecie hodowli gołębi pocztowych!
              </p>

              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Aby dokończyć proces rejestracji i aktywować swoje konto, kliknij poniższy przycisk:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center; padding: 0 0 30px 0;">
                    <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: none; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      ✅ Zweryfikuj Mój Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:
              </p>

              <p style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #475569; margin: 0 0 30px 0;">
                <a href="${verificationLink}" style="color: #3b82f6; text-decoration: none;">${verificationLink}</a>
              </p>

              <!-- Benefits Section -->
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 0 0 30px 0;">
                <p style="color: #1e293b; font-size: 15px; font-weight: bold; margin: 0 0 12px 0;">
                  🎯 Co zyskujesz po weryfikacji:
                </p>
                <ul style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Pełny dostęp do aukcji gołębi pocztowych</li>
                  <li>Możliwość licytowania i kupowania gołębi</li>
                  <li>Tworzenie własnych aukcji i sprzedaż</li>
                  <li>Uczestnictwo w społeczności hodowców</li>
                  <li>Dostęp do profilu hodowcy i statystyk</li>
                </ul>
              </div>

              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">
                <strong>Uwaga:</strong> Link weryfikacyjny wygasa po 24 godzinach. Jeśli nie rejestrowałeś się na naszej platformie, zignoruj ten email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} <strong>Pałka MTM</strong> - Mistrzowie Sprintu
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Platforma aukcyjna dla hodowców gołębi pocztowych
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generuje prostszy template tekstowy jako fallback
 */
export function generateEmailVerificationTextTemplate({
  verificationLink,
  userName,
}: Omit<EmailVerificationTemplateParams, 'logoUrl'>): string {
  return `
Witaj${userName ? `, ${userName}` : ''}!

Dziękujemy za rejestrację na platformie Pałka MTM - Twojego miejsca w świecie hodowli gołębi pocztowych!

Aby dokończyć proces rejestracji i aktywować swoje konto, kliknij poniższy link:

${verificationLink}

Co zyskujesz po weryfikacji:
- Pełny dostęp do aukcji gołębi pocztowych
- Możliwość licytowania i kupowania gołębi
- Tworzenie własnych aukcji i sprzedaż
- Uczestnictwo w społeczności hodowców
- Dostęp do profilu hodowcy i statystyk

Link weryfikacyjny wygasa po 24 godzinach.
Jeśli nie rejestrowałeś się na naszej platformie, zignoruj ten email.

---
© ${new Date().getFullYear()} Pałka MTM - Mistrzowie Sprintu
Platforma aukcyjna dla hodowców gołębi pocztowych
  `.trim();
}
