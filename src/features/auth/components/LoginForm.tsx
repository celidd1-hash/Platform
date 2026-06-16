'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '../actions';
import type { FormState } from '../actions';
import { Field, SubmitButton, FormMessage } from './form-ui';

const initial: FormState = { status: 'idle' };

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Вход</h1>
      <FormMessage status={state.status} message={state.message} />
      <Field label="Email" name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} />
      <Field
        label="Пароль"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />
      <Field
        label="Код 2FA (если включён)"
        name="token"
        autoComplete="one-time-code"
      />
      <SubmitButton>Войти</SubmitButton>
      <div className="flex justify-between text-xs text-muted">
        <Link href="/reset" className="hover:text-gold">
          Забыли пароль?
        </Link>
        <Link href="/register" className="hover:text-gold">
          Создать аккаунт
        </Link>
      </div>
    </form>
  );
}
