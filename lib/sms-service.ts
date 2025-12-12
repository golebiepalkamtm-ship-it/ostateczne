/**
 * SMS Service - Używa tylko Firebase Phone Authentication
 * SMS są wysyłane bezpośrednio przez Firebase, nie przez nasz serwer
 */

export interface SMSProvider {
  sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Firebase Phone Auth Provider
 * Uwaga: Ten provider tylko loguje. Rzeczywiste SMS są wysyłane przez Firebase Phone Auth SDK po stronie klienta
 */
import { debug, isDev } from './logger';

export class FirebasePhoneAuthProvider implements SMSProvider {
  async sendSMS(
    phoneNumber: string,
    _message: string,
  ): Promise<{ success: boolean; error?: string }> {
    // Firebase Phone Auth wymaga konfiguracji Firebase
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return {
        success: false,
        error:
          'Firebase nie jest skonfigurowany. Ustaw NEXT_PUBLIC_FIREBASE_PROJECT_ID i inne zmienne Firebase',
      };
    }

    // Firebase Phone Auth wysyła SMS automatycznie przez SDK po stronie klienta
    // Ten endpoint tylko zapisuje kod w bazie danych
    if (isDev)
      debug(
        `✅ Firebase Phone Auth - Kod weryfikacyjny zostanie wysłany przez Firebase do ${phoneNumber}`,
      );
    return { success: true };
  }
}

/**
 * SMS Service - tylko Firebase Phone Auth
 */
export class SMSService {
  private provider: SMSProvider;

  constructor() {
    this.provider = new FirebasePhoneAuthProvider();
  }

  async sendVerificationSMS(
    phoneNumber: string,
    verificationCode: string,
  ): Promise<{ success: boolean; error?: string }> {
    // Uwaga: W Firebase Phone Auth, SMS jest wysyłany automatycznie przez Firebase
    // Ten kod tylko loguje, faktyczne wysyłanie odbywa się w komponencie klienta
    if (isDev) debug(`📱 Kod weryfikacyjny dla ${phoneNumber}: ${verificationCode}`);
    return this.provider.sendSMS(phoneNumber, verificationCode);
  }

  async sendNotificationSMS(
    phoneNumber: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.provider.sendSMS(phoneNumber, message);
  }
}

// Singleton instance
export const smsService = new SMSService();
