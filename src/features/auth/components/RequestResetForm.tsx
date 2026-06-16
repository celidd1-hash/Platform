'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestResetAction } from '../actions';
import type { FormState } from '../actions';
import { Field, SubmitButton, FormMessage } from './form-ui';

const initial: FormState = { status: 'idle' };

export function RequestResetForm() {
  const [state, action] = useActionState(requestResetAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Сброс пароля</h1>
      <p className="text-sm text-muted">Укажите email — пришлём ссылку для восстановления.</p>
      <FormMessage status={state.status} message={state.message} />
      {state.status !== 'success' && (
        <>
          <Field label="Email" name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} />
          <SubmitButton>Отправить ссылку</SubmitButton>
        </>
      )}
      <div className="text-center text-xs text-muted">
        <Link href="/login" className="hover:text-gold">
          Вернуться ко входу
        </Link>
      </div>
    </form>
  );
}
