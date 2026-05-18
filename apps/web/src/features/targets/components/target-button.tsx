'use client';

import {
  CreateAchievementTargetDtoPriorityEnum,
  CreateGameTargetDtoPriorityEnum,
  ListAccountTargetsStatusEnum,
  ListAccountTargetsTypeEnum,
  ResponseError,
} from '@steam-achievement/client-sdk';
import type { ReactNode } from 'react';

import { buildSignInUrl } from '@/features/auth/components/auth-status';
import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { useAccountTargets } from '../api/use-account-targets';
import { useCreateAchievementTarget } from '../api/use-create-achievement-target';
import { useCreateGameTarget } from '../api/use-create-game-target';

export function TargetButton({
  isAuthenticated,
  isDisabled = false,
  isPending = false,
  isTargeted,
  disabledLabel = 'Already unlocked',
  onAdd,
  signInUrl,
  targetHref = '/account/targets',
}: Readonly<{
  isAuthenticated: boolean;
  isDisabled?: boolean;
  isPending?: boolean;
  isTargeted: boolean;
  disabledLabel?: string;
  onAdd: () => void;
  signInUrl: string;
  targetHref?: string;
}>): ReactNode {
  if (!isAuthenticated) {
    return (
      <a
        className="inline-flex rounded-full border border-lime-300/30 px-3 py-2 text-sm font-semibold text-lime-100 hover:bg-lime-300/10"
        href={signInUrl}
      >
        Sign in to target
      </a>
    );
  }

  if (isDisabled) {
    return (
      <button
        className="inline-flex cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-400"
        disabled
        type="button"
      >
        {disabledLabel}
      </button>
    );
  }

  if (isTargeted) {
    return (
      <a
        className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/10"
        href={targetHref}
      >
        Targeted
      </a>
    );
  }

  return (
    <button
      className="inline-flex rounded-full bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-60"
      disabled={isPending}
      onClick={onAdd}
      type="button"
    >
      {isPending ? 'Adding...' : 'Add Target'}
    </button>
  );
}

export function GameTargetButton({
  steamAppId,
}: Readonly<{
  steamAppId: number;
}>): ReactNode {
  const currentUser = useCurrentUser();
  const isAuthenticated = currentUser.data !== undefined && currentUser.data !== null;
  const targets = useAccountTargets(
    {
      limit: 100,
      status: ListAccountTargetsStatusEnum.Active,
      type: ListAccountTargetsTypeEnum.Game,
    },
    isAuthenticated,
  );
  const createTarget = useCreateGameTarget();
  const isTargeted =
    targets.data?.items.some(
      (target) => target.type === 'game' && target.game.steamAppId === steamAppId,
    ) ?? false;

  return (
    <TargetButton
      isAuthenticated={isAuthenticated}
      isPending={createTarget.isPending}
      isTargeted={isTargeted}
      onAdd={() =>
        createTarget.mutate({
          priority: CreateGameTargetDtoPriorityEnum.Medium,
          steamAppId,
          targetCompletionPercentage: 100,
        })
      }
      signInUrl={buildSignInUrl(getCurrentReturnTo())}
    />
  );
}

export function AchievementTargetButton({
  achievementId,
  unlockState,
}: Readonly<{
  achievementId: string;
  unlockState?: 'locked' | 'unknown' | 'unlocked';
}>): ReactNode {
  const currentUser = useCurrentUser();
  const isAuthenticated = currentUser.data !== undefined && currentUser.data !== null;
  const targets = useAccountTargets(
    {
      limit: 100,
      status: ListAccountTargetsStatusEnum.Active,
      type: ListAccountTargetsTypeEnum.Achievement,
    },
    isAuthenticated,
  );
  const createTarget = useCreateAchievementTarget();
  const isTargeted =
    targets.data?.items.some(
      (target) =>
        target.type === 'achievement' && target.achievement?.id === achievementId,
    ) ?? false;
  const isAlreadyUnlocked = isAchievementTargetDisabled(unlockState);
  const errorMessage = getAchievementTargetCreateErrorMessage(createTarget.error);

  return (
    <div className="inline-grid gap-2 justify-items-end">
      <TargetButton
        disabledLabel="Already unlocked"
        isAuthenticated={isAuthenticated}
        isDisabled={isAlreadyUnlocked}
        isPending={createTarget.isPending}
        isTargeted={isTargeted}
        onAdd={() => {
          if (isAlreadyUnlocked) {
            return;
          }

          createTarget.mutate({
            achievementId,
            priority: CreateAchievementTargetDtoPriorityEnum.Medium,
          });
        }}
        signInUrl={buildSignInUrl(getCurrentReturnTo())}
      />
      {errorMessage ? (
        <p className="max-w-48 text-xs text-amber-100">{errorMessage}</p>
      ) : null}
    </div>
  );
}

export function getAchievementTargetCreateErrorMessage(
  error: unknown,
): string | null {
  if (error instanceof ResponseError && error.response.status === 409) {
    return 'Already unlocked on your profile.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

export function isAchievementTargetDisabled(
  unlockState: 'locked' | 'unknown' | 'unlocked' | undefined,
): boolean {
  return unlockState === 'unlocked';
}

function getCurrentReturnTo(): string {
  if (typeof window === 'undefined') {
    return '/account/targets';
  }

  return `${window.location.pathname}${window.location.search}`;
}
