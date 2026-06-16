import { ResetPasswordForm } from '@/features/auth';

export const metadata = { title: 'Новый пароль — SVETOZAR SCHOOL' };

export default async function ResetWithTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
