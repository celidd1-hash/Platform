import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/profile/queries', () => ({
  getAuthHash: vi.fn(),
  updatePasswordHash: vi.fn(),
  writeAuditLog: vi.fn(),
}));
vi.mock('@/lib/password', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('new-hash'),
}));

import * as q from '@/features/profile/queries';
import { verifyPassword } from '@/lib/password';
import { changePassword } from '@/features/profile/service';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(q.getAuthHash).mockResolvedValue({ passwordHash: 'old-hash' } as never);
});

describe('changePassword (ТЗ §6А.2)', () => {
  it('отклоняет неверный текущий пароль', async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false);
    const r = await changePassword('u1', { current: 'wrong', next: 'newpassword123' });
    expect(r.ok).toBe(false);
    expect(q.updatePasswordHash).not.toHaveBeenCalled();
  });

  it('меняет пароль при верном текущем и пишет аудит', async () => {
    vi.mocked(verifyPassword).mockResolvedValue(true);
    const r = await changePassword('u1', { current: 'right', next: 'newpassword123' });
    expect(r.ok).toBe(true);
    expect(q.updatePasswordHash).toHaveBeenCalledWith('u1', 'new-hash');
    expect(q.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'password_change', actorId: 'u1' }),
    );
  });
});
