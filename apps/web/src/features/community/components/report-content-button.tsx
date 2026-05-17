'use client';

import {
  CreateContentReportDtoReasonEnum,
  type CreateContentReportDtoTargetTypeEnum,
} from '@steam-achievement/client-sdk';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { useCurrentUser } from '@/features/auth/api/use-current-user';
import { getErrorMessage } from '@/lib/format';

import { useCreateContentReport } from '../api/use-create-content-report';

export function ReportContentButton({
  targetId,
  targetType,
}: Readonly<{
  targetId: string;
  targetType: CreateContentReportDtoTargetTypeEnum;
}>): ReactNode {
  const currentUser = useCurrentUser();
  const report = useCreateContentReport();
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState('');
  const [reason, setReason] = useState<CreateContentReportDtoReasonEnum>(
    CreateContentReportDtoReasonEnum.Other,
  );
  const [message, setMessage] = useState<string | null>(null);

  if (!currentUser.data) {
    return <p className="text-sm text-slate-600">Sign in to report content.</p>;
  }

  async function submitReport() {
    setMessage(null);

    try {
      await report.mutateAsync({
        targetType,
        targetId,
        reason,
        details: details.trim().length > 0 ? details.trim() : null,
      });
      setMessage('Report submitted for review.');
      setDetails('');
      setIsOpen(false);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">Report content</h2>
          <p className="mt-1 text-sm text-slate-600">
            Reports are private moderation intake records.
          </p>
        </div>
        <button
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => setIsOpen((value) => !value)}
          type="button"
        >
          {isOpen ? 'Cancel report' : 'Report'}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Reason
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal"
              onChange={(event) =>
                setReason(event.target.value as CreateContentReportDtoReasonEnum)
              }
              value={reason}
            >
              {Object.values(CreateContentReportDtoReasonEnum).map((value) => (
                <option key={value} value={value}>
                  {formatReason(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Details
            <textarea
              className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal"
              maxLength={2000}
              onChange={(event) => setDetails(event.target.value)}
              value={details}
            />
          </label>
          <button
            className="w-fit rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            disabled={report.isPending}
            onClick={() => void submitReport()}
            type="button"
          >
            {report.isPending ? 'Submitting...' : 'Submit report'}
          </button>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}

function formatReason(reason: CreateContentReportDtoReasonEnum): string {
  return reason.replaceAll('_', ' ');
}
