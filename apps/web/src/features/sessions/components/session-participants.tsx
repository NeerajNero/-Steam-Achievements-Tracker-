import type { GamingSessionParticipantResponseDto } from '@steam-achievement/client-sdk';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/panel-state';

import { getSessionProfileHref } from '../utils/session-links';

export function SessionParticipants({
  participants,
}: Readonly<{
  participants: GamingSessionParticipantResponseDto[];
}>): ReactNode {
  if (participants.length === 0) {
    return <EmptyState message="No participants are listed for this session." />;
  }

  return (
    <div className="divide-y divide-slate-200">
      {participants.map((participant, index) => {
        const href = getSessionProfileHref(participant.user);
        const label = participant.user.displayName ?? 'Steam user';

        return (
          <div className="flex items-center gap-3 p-4" key={`${label}-${index}`}>
            {participant.user.avatarUrl ? (
              <img
                alt=""
                className="h-10 w-10 rounded-full border border-slate-200"
                src={participant.user.avatarUrl}
              />
            ) : null}
            <div className="min-w-0">
              {href ? (
                <Link
                  className="font-medium text-slate-950 hover:text-blue-700"
                  href={href}
                >
                  {label}
                </Link>
              ) : (
                <p className="font-medium text-slate-950">{label}</p>
              )}
              <p className="text-xs text-slate-500 capitalize">
                {participant.role} · {participant.status}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
