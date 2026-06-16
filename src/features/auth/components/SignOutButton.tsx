'use client';

import { logoutAction } from '../actions';

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="font-label text-[11px] uppercase tracking-[2px] text-muted-2 transition-colors hover:text-gold"
      >
        Выйти
      </button>
    </form>
  );
}
