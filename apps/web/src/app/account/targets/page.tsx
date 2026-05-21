import type { ReactNode } from 'react';

import { AccountTargetsPageClient } from '@/features/targets/components/account-targets-page-client';

export default async function AccountTargetsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>): Promise<ReactNode> {
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <AccountTargetsPageClient statusParam={resolvedSearchParams.status ?? null} />
  );
}
