'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { resetPasswordAction } from '../actions';
import type { FormState } from '../actions';
import { Field, SubmitButton, FormMessage } from './form-ui';

const initial: FormState = { status: 'idle' };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <h1 className="font-display text-3xl font-semibold">Новый пароль</h1>
      <FormMessage status={state.status} message={state.message} />
      {state.status === 'success' ? (
        <Link
          href="/login"
          className="w-full rounded-xl bg-gradient-to-r from-gold-deep to-gold py-3 text-center font-label text-sm tracking-[2px] text-[#1a1206] hover:to-gold-bright"
        >
          Войти
        </Link>
      ) : (
        <>
          <Field
            label="Новый пароль"
            name="password"
            type="password"
            autoComplete="new-password"
            error={state.fieldErrors?.password}
          />
          <SubmitButton>Сохранить пароль</SubmitButton>
        </>
      )}
    </form>
  );
}
