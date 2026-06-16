'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction } from '../actions';
import type { FormState } from '../actions';
import { Field, SubmitButton, FormMessage } from './form-ui';

const initial: FormState = { status: 'idle' };

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Регистрация</h1>
      <FormMessage status={state.status} message={state.message} />
      {state.status !== 'success' && (
        <>
          <Field label="Имя" name="name" autoComplete="name" error={state.fieldErrors?.name} />
          <Field label="Email" name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} />
          <Field
            label="Пароль"
            name="password"
            type="password"
            autoComplete="new-password"
            error={state.fieldErrors?.password}
          />
          <label className="flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" name="acceptTerms" className="mt-0.5 accent-[var(--gold)]" />
            <span>
              Я принимаю условия использования и{' '}
              <Link href="/legal/privacy" className="text-gold hover:text-gold-bright">
                политику конфиденциальности
              </Link>
              {state.fieldErrors?.acceptTerms && (
                <span className="mt-1 block text-[var(--err)]">{state.fieldErrors.acceptTerms}</span>
              )}
            </span>
          </label>
          <SubmitButton>Создать аккаунт</SubmitButton>
        </>
      )}
      <div className="text-center text-xs text-muted">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="hover:text-gold">
          Войти
        </Link>
      </div>
    </form>
  );
}
