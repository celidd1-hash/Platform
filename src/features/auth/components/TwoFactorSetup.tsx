'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { startTwoFactorAction, confirmTwoFactorAction, disableTwoFactorAction } from '../actions';

const inputCls =
  'w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm tracking-[3px] text-ink outline-none focus:border-gold';

/** Настройка двухфакторной аутентификации (TOTP, ТЗ §6А.2). Обязательна для админов. */
export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [qr, setQr] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setEnabled] = useState(enabled);

  function begin() {
    setError(null);
    start(async () => {
      const res = await startTwoFactorAction();
      if (res.ok) setQr(res.data);
      else setError(res.error);
    });
  }

  function confirm() {
    setError(null);
    start(async () => {
      const res = await confirmTwoFactorAction(code);
      if (res.ok) {
        setEnabled(true);
        setQr(null);
        setCode('');
        router.refresh();
      } else setError(res.error);
    });
  }

  function disable() {
    setError(null);
    start(async () => {
      const res = await disableTwoFactorAction(code);
      if (res.ok) {
        setEnabled(false);
        setCode('');
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-token border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-ink">Двухфакторная аутентификация</div>
          <div className="text-xs text-muted-2">
            {isEnabled ? '✅ Включена' : 'Защита входа кодом из приложения-аутентификатора'}
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-[var(--err)]">{error}</div>}

      {!isEnabled && !qr && (
        <button
          onClick={begin}
          disabled={pending}
          className="self-start rounded-xl border border-gold/40 px-5 py-2.5 font-label text-sm tracking-[1px] text-gold-bright hover:bg-[rgba(200,160,79,0.08)] disabled:opacity-50"
        >
          Включить 2FA
        </button>
      )}

      {!isEnabled && qr && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Отсканируйте QR в приложении (Google Authenticator, Authy) или введите ключ вручную:
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.qrDataUrl} alt="QR для 2FA" className="h-44 w-44 rounded-lg bg-white p-2" />
          <code className="break-all rounded bg-bg-2 px-3 py-2 text-xs text-gold-bright">{qr.secret}</code>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-значный код"
            inputMode="numeric"
            className={inputCls}
          />
          <button
            onClick={confirm}
            disabled={pending || code.length < 6}
            className="self-start rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright disabled:opacity-50"
          >
            Подтвердить и включить
          </button>
        </div>
      )}

      {isEnabled && (
        <div className="flex flex-col gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код для отключения"
            inputMode="numeric"
            className={inputCls}
          />
          <button
            onClick={disable}
            disabled={pending || code.length < 6}
            className="self-start rounded-xl border border-[rgba(196,90,90,0.4)] px-4 py-2 text-sm text-[var(--err)] hover:bg-[rgba(196,90,90,0.08)] disabled:opacity-50"
          >
            Отключить 2FA
          </button>
        </div>
      )}
    </div>
  );
}
