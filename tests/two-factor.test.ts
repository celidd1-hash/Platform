import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/auth/queries', () => ({
  findUserByEmail: vi.fn(),
  writeAuditLog: vi.fn(),
}));
vi.mock('@/lib/password', () => ({ verifyPassword: vi.fn(), hashPassword: vi.fn() }));
vi.mock('@/lib/crypto', () => ({ decryptSecret: vi.fn(() => 'SECRET'), encryptSecret: vi.fn() }));
vi.mock('@/lib/totp', () => ({
  verifyTotp: vi.fn(),
  generateTotpSecret: vi.fn(),
  totpKeyUri: vi.fn(),
}));

import * as q from '@/features/auth/queries';
import { verifyPassword } from '@/lib/password';
import { verifyTotp } from '@/lib/totp';
import { authenticateCredentials } from '@/features/auth/service';

const baseUser = {
  id: 'u1',
  email: 'admin@x.io',
  name: 'Админ',
  role: 'admin',
  passwordHash: 'hash',
  emailVerifiedAt: new Date(),
  isBlocked: false,
  twoFactorEnabled: true,
  twoFactorSecret: 'enc-secret',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(q.findUserByEmail).mockResolvedValue(baseUser as never);
  vi.mocked(verifyPassword).mockResolvedValue(true);
});

describe('authenticateCredentials + 2FA (ТЗ §6А.2)', () => {
  it('с включённой 2FA без кода — отказ', async () => {
    const r = await authenticateCredentials('2fa-no-token@x.io', 'pw');
    expect(r).toBeNull();
  });

  it('с неверным кодом — отказ', async () => {
    vi.mocked(verifyTotp).mockReturnValue(false);
    const r = await authenticateCredentials('2fa-bad@x.io', 'pw', '000000');
    expect(r).toBeNull();
  });

  it('с верным кодом — вход успешен', async () => {
    vi.mocked(verifyTotp).mockReturnValue(true);
    const r = await authenticateCredentials('2fa-ok@x.io', 'pw', '123456');
    expect(r).not.toBeNull();
    expect(r?.role).toBe('admin');
  });

  it('без 2FA код игнорируется', async () => {
    vi.mocked(q.findUserByEmail).mockResolvedValue({ ...baseUser, twoFactorEnabled: false, twoFactorSecret: null } as never);
    const r = await authenticateCredentials('no-2fa@x.io', 'pw');
    expect(r).not.toBeNull();
  });
});
