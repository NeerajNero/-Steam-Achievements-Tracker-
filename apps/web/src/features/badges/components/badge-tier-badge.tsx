import type { ReactNode } from 'react';

const TIER_CLASS_NAMES: Record<string, string> = {
  bronze: 'border-amber-300 bg-amber-50 text-amber-800',
  silver: 'border-slate-300 bg-slate-50 text-slate-700',
  gold: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  platinum: 'border-cyan-300 bg-cyan-50 text-cyan-800',
};

export function BadgeTierBadge({
  tier,
}: Readonly<{
  tier?: string | null;
}>): ReactNode {
  if (!tier) {
    return null;
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${TIER_CLASS_NAMES[tier] ?? 'border-slate-300 bg-slate-50 text-slate-700'}`}
    >
      {formatBadgeTier(tier)}
    </span>
  );
}

export function formatBadgeTier(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
