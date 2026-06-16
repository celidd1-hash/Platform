import { authenticator } from 'otplib';

/**
 * Обёртка над TOTP (ТЗ §6А.2) для 2FA. Имя «otplib» живёт только здесь.
 * Допускаем окно ±2 шага (±60 с) на рассинхрон часов телефона и сервера.
 */
authenticator.options = { window: 2 };

const ISSUER = 'SVETOZAR SCHOOL';

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/** otpauth:// URL для QR-кода в приложении-аутентификаторе. */
export function totpKeyUri(accountName: string, secret: string): string {
  return authenticator.keyuri(accountName, ISSUER, secret);
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: token.trim(), secret });
  } catch {
    return false;
  }
}
